import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { beforeAll, describe, expect, it } from "vitest";
import { recordDecision } from "@/modules/approvals/server";
import { nextChangeNumber } from "@/modules/projects/server";
import { db } from "@/shared/db/client";
import { collection } from "@/shared/db/collections";
import { ensureIndexes } from "@/shared/db/indexes";
import { withTransaction } from "@/shared/db/transaction";
import { minor } from "@/shared/lib/money";
import {
  insertActivity,
  findActivity,
} from "@/modules/activity/server/repository";
import * as repo from "./repository";
import { refreshChangeTotals } from "./totals";

beforeAll(async () => {
  await ensureIndexes(db());
});

async function activeProject(ws: string, status = "active") {
  const _id = new ObjectId();
  await collection("projects").insertOne({
    _id,
    workspaceId: ws,
    status,
    totals: {
      baseline: 9_600_000,
      approvedChanges: 0,
      pendingChanges: 0,
      paid: 0,
      due: 0,
    },
  });
  return _id;
}

const blog = (projectId: ObjectId, number: number) => ({
  projectId,
  number,
  currency: "INR" as const,
  title: "Blog + WhatsApp chat button",
  description: null,
  items: [
    {
      id: randomUUID(),
      title: "Blog",
      description: null,
      amount: minor(1_500_000),
    },
  ],
  total: 1_500_000,
  billing: { option: "final" as const, milestoneId: null },
  source: { channel: "whatsapp" as const, note: "Asked on 3 Nov" },
});

const sentData = {
  reference: "CR-001",
  title: "Blog + WhatsApp chat button",
  total: 1_500_000,
} as never;

async function sendIt(ws: string, projectId: ObjectId, number: number) {
  const doc = await repo.findChangeDoc(ws, projectId, number);
  if (!doc) throw new Error("missing");
  const sentAt = new Date();
  expect(
    await repo.markChangeSent(ws, doc._id, {
      data: sentData,
      sentAt,
      sentBy: { userId: "u1", email: "a@b.in" },
    }),
  ).toBe(true);
  return { doc, sentAt };
}

function decide(
  ws: string,
  projectId: ObjectId,
  id: ObjectId,
  sentAt: Date,
  decision: "approved" | "rejected",
) {
  return withTransaction(async (session) => {
    const at = new Date();
    const approvalId = await recordDecision(
      {
        workspaceId: ws,
        projectId,
        subject: { type: "change_request", id: id.toHexString() },
        decision: {
          decision,
          name: "Rahul Mehta",
          email: "rahul@mehta.in",
          comment: null,
        },
        decidedAt: at,
        snapshot: { reference: "CR-001", total: 1_500_000 },
        ip: null,
        userAgent: null,
      },
      session,
    );
    const ok = await repo.applyChangeDecision(
      {
        workspaceId: ws,
        id,
        sentAt,
        decision,
        approvalId,
        at,
        name: "Rahul Mehta",
        email: "rahul@mehta.in",
        comment: null,
      },
      session,
    );
    if (!ok) throw new Error("stale");
    await refreshChangeTotals(ws, projectId, session);
    await insertActivity(
      ws,
      {
        projectId,
        type: decision === "approved" ? "change.approved" : "change.rejected",
        actor: { kind: "client", name: "Rahul Mehta", email: "rahul@mehta.in" },
      },
      session,
    );
  });
}

const totals = async (id: ObjectId) =>
  (
    await collection<{
      totals: { approvedChanges: number; pendingChanges: number };
    }>("projects").findOne({ _id: id })
  )?.totals;

describe("change requests", () => {
  it("numbers CRs per project, only once the proposal is approved", async () => {
    const ws = "ws_numbers";
    const a = await activeProject(ws);
    const b = await activeProject(ws);
    expect(await nextChangeNumber(ws, a)).toBe(1);
    expect(await nextChangeNumber(ws, a)).toBe(2);
    expect(await nextChangeNumber(ws, b)).toBe(1);
    expect(
      await nextChangeNumber(ws, await activeProject(ws, "draft")),
    ).toBeNull();
    expect(await nextChangeNumber("ws_other", a)).toBeNull();
  });

  it("moves draft → sent → draft → cancelled, keeping totals right", async () => {
    const ws = "ws_flow";
    const p = await activeProject(ws);
    await repo.insertChange(ws, blog(p, 1));
    const { doc } = await sendIt(ws, p, 1);
    await refreshChangeTotals(ws, p);
    expect(await totals(p)).toMatchObject({
      pendingChanges: 1_500_000,
      approvedChanges: 0,
    });

    // Sent: can't edit, delete or cancel.
    expect(await repo.updateDraftChange(ws, doc._id, blog(p, 1))).toBe(false);
    expect(await repo.deleteUnsentDraft(ws, doc._id)).toBe(false);
    expect(await repo.markChangeCancelled(ws, doc._id)).toBe(false);

    expect(await repo.markChangeWithdrawn(ws, doc._id)).toBe(true);
    await refreshChangeTotals(ws, p);
    expect(await totals(p)).toMatchObject({ pendingChanges: 0 });
    // The client saw it once: it can be cancelled, not deleted.
    expect(await repo.deleteUnsentDraft(ws, doc._id)).toBe(false);
    expect(await repo.markChangeCancelled(ws, doc._id)).toBe(true);
    expect((await repo.findChangeDoc(ws, p, 1))?.status).toBe("withdrawn");
  });

  it("deletes a draft the client never saw", async () => {
    const ws = "ws_delete";
    const p = await activeProject(ws);
    await repo.insertChange(ws, blog(p, 1));
    const doc = await repo.findChangeDoc(ws, p, 1);
    expect(await repo.deleteUnsentDraft("ws_other", doc!._id)).toBe(false);
    expect(await repo.deleteUnsentDraft(ws, doc!._id)).toBe(true);
  });

  it("approves atomically, updates totals and history, and never twice", async () => {
    const ws = "ws_decide";
    const p = await activeProject(ws);
    await repo.insertChange(ws, blog(p, 1));
    const { doc, sentAt } = await sendIt(ws, p, 1);
    await decide(ws, p, doc._id, sentAt, "approved");

    const saved = await repo.findChangeDoc(ws, p, 1);
    expect(saved).toMatchObject({
      status: "approved",
      decision: { name: "Rahul Mehta" },
    });
    expect(await totals(p)).toMatchObject({
      approvedChanges: 1_500_000,
      pendingChanges: 0,
    });
    expect((await findActivity(ws, p)).map((e) => e.type)).toEqual([
      "change.approved",
    ]);

    // A second tap: no longer sent → rolled back, nothing extra written.
    await expect(decide(ws, p, doc._id, sentAt, "approved")).rejects.toThrow();
    expect(
      await collection("approvals").countDocuments({ workspaceId: ws }),
    ).toBe(1);
    expect(await findActivity(ws, p)).toHaveLength(1);
  });

  it("refuses an answer to an older version", async () => {
    const ws = "ws_stale";
    const p = await activeProject(ws);
    await repo.insertChange(ws, blog(p, 1));
    const { doc, sentAt } = await sendIt(ws, p, 1);
    await repo.markChangeWithdrawn(ws, doc._id);
    await sendIt(ws, p, 1); // re-sent: new sentAt
    await expect(decide(ws, p, doc._id, sentAt, "approved")).rejects.toThrow(
      "stale",
    );
    expect(
      await collection("approvals").countDocuments({ workspaceId: ws }),
    ).toBe(0);
    expect((await repo.findChangeDoc(ws, p, 1))?.status).toBe("sent");
  });

  it("filters the client's history to what they may see", async () => {
    const ws = "ws_history";
    const p = await activeProject(ws);
    const me = { kind: "member" as const, userId: "u1", name: "Hensal" };
    await insertActivity(ws, {
      projectId: p,
      type: "change.created",
      actor: me,
    });
    await insertActivity(ws, {
      projectId: p,
      type: "link.replaced",
      actor: me,
    });
    await insertActivity(ws, { projectId: p, type: "change.sent", actor: me });
    expect(
      (await findActivity(ws, p, ["change.sent", "change.approved"])).map(
        (e) => e.type,
      ),
    ).toEqual(["change.sent"]);
    expect(await findActivity(ws, p)).toHaveLength(3);
  });
});
