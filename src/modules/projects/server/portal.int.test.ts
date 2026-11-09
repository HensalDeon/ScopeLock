import { ObjectId } from "mongodb";
import { beforeAll, describe, expect, it } from "vitest";
import { collection } from "@/shared/db/collections";
import { buildProjectPlan, projectInputSchema } from "../domain/project-input";
import { emptyTotals } from "../domain/project";
import { recordDecision } from "@/modules/approvals/server";
import { db } from "@/shared/db/client";
import { ensureIndexes } from "@/shared/db/indexes";
import { withTransaction } from "@/shared/db/transaction";
import { hashToken } from "@/shared/lib/token";
import { newPortalLink, portalUrl } from "./portal";
import * as repo from "./repository";
import * as portalRepo from "./portal-repository";

let n = 0;
const newId = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;

function rahulsProject(clientId = new ObjectId()): repo.ProjectData {
  const input = projectInputSchema.parse({
    clientId: clientId.toHexString(),
    currency: "INR",
    name: "Website redesign",
    description: "",
    items: JSON.stringify([
      { title: "Home page", amount: "20000" },
      { title: "About page", amount: "12000" },
      { title: "Services page", amount: "16000" },
      { title: "Portfolio page", amount: "20000" },
      { title: "Contact page", amount: "12000" },
    ]),
    billingModel: "milestones",
    milestones: JSON.stringify([
      { name: "Advance", percent: 30 },
      { name: "Design approved", percent: 30 },
      { name: "Before launch", percent: 40 },
    ]),
  });
  const plan = buildProjectPlan(input, newId);
  return {
    clientId,
    currency: input.currency,
    name: input.name,
    description: input.description,
    billingModel: input.billingModel,
    items: plan.items,
    total: plan.total,
    milestones: plan.milestones,
    proposal: plan.proposal,
    totals: emptyTotals(plan.total),
  };
}

beforeAll(async () => {
  await ensureIndexes(db());
});

const SENT_DATA = {
  title: "Website redesign",
  total: 8_000_000,
  issuedOn: new Date("2026-11-06T10:00:00Z"),
  items: [{ id: "a", title: "Home page", amount: 2_000_000 }],
};

async function sentProject(ws: string) {
  const id = new ObjectId(await repo.insertProject(ws, rahulsProject()));
  const portal = newPortalLink();
  const sentAt = new Date();
  const ok = await portalRepo.markSent(
    ws,
    id,
    {
      data: SENT_DATA as never,
      sentAt,
      sentBy: { userId: "u1", email: "asha@studio.in" },
    },
    portal,
  );
  expect(ok).toBe(true);
  return { id, portal, sentAt };
}

function decide(
  ws: string,
  p: { id: ObjectId; portal: { tokenHash: string }; sentAt: Date },
  decision: "approved" | "rejected",
) {
  return withTransaction(async (session) => {
    const at = new Date();
    const approvalId = await recordDecision(
      {
        workspaceId: ws,
        projectId: p.id,
        subject: { type: "baseline", id: p.id.toHexString() },
        decision: {
          decision,
          name: "Rahul Mehta",
          email: "rahul@mehta.in",
          comment: decision === "rejected" ? "Add a blog" : null,
        },
        decidedAt: at,
        snapshot: SENT_DATA,
        ip: "203.0.113.7",
        userAgent: "test",
      },
      session,
    );
    const applied = await portalRepo.applyDecision(
      {
        workspaceId: ws,
        projectId: p.id,
        tokenHash: p.portal.tokenHash,
        sentAt: p.sentAt,
        decision,
        approvalId,
        at,
        name: "Rahul Mehta",
        email: "rahul@mehta.in",
        comment: null,
      },
      session,
    );
    if (!applied) throw new Error("stale");
    return approvalId;
  });
}

describe("client portal lifecycle", () => {
  it("sends once, finds the project by link hash, and shows the link again", async () => {
    const ws = "ws_send";
    const { id, portal } = await sentProject(ws);
    const project = await repo.findProject(ws, id);
    expect(project).toMatchObject({
      status: "awaiting_approval",
      hasPortalLink: true,
    });

    // Sending again is refused: it's no longer a draft.
    expect(
      await portalRepo.markSent(
        ws,
        id,
        {
          data: SENT_DATA as never,
          sentAt: new Date(),
          sentBy: { userId: "u1", email: "x@y.in" },
        },
        null,
      ),
    ).toBe(false);

    // The sealed copy opens to a link whose token hashes to the stored hash.
    const url = portalUrl(portal);
    const token = url?.split("/c/")[1] ?? "";
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const found = await portalRepo.findByPortalTokenHash(hashToken(token));
    expect(found).toMatchObject({
      workspaceId: ws,
      project: { id: id.toHexString() },
    });
    expect(found?.sent?.data.title).toBe("Website redesign");

    // The stored copy is sealed, not the raw token.
    const raw = await collection("projects").findOne({ _id: id });
    expect(JSON.stringify(raw)).not.toContain(token);
  });

  it("approves atomically: record + active, and never twice", async () => {
    const ws = "ws_approve";
    const p = await sentProject(ws);
    await decide(ws, p, "approved");

    const project = await repo.findProject(ws, p.id);
    expect(project?.status).toBe("active");
    expect(project?.baseline.approvedAt).toBeInstanceOf(Date);
    expect(project?.lastDecision).toMatchObject({
      decision: "approved",
      name: "Rahul Mehta",
    });

    // A second tap: the project is no longer waiting, nothing is written.
    await expect(decide(ws, p, "approved")).rejects.toThrow();
    expect(
      await collection("approvals").countDocuments({ workspaceId: ws }),
    ).toBe(1);
  });

  it("the unique index blocks a second approval of the same subject", async () => {
    const ws = "ws_unique";
    const p = await sentProject(ws);
    await decide(ws, p, "approved");
    // Force the project back to waiting to simulate a race past the status guard.
    await collection("projects").updateOne(
      { _id: p.id },
      { $set: { status: "awaiting_approval" } },
    );
    await expect(decide(ws, p, "approved")).rejects.toMatchObject({
      code: 11000,
    });
  });

  it("changes requested → draft; withdraw, replace link and re-send guard old answers", async () => {
    const ws = "ws_reject";
    const p = await sentProject(ws);
    await decide(ws, p, "rejected");
    expect((await repo.findProject(ws, p.id))?.status).toBe("draft");

    // Re-send keeps the link (no new portal given).
    const sentAt = new Date(Date.now() + 1000);
    expect(
      await portalRepo.markSent(
        ws,
        p.id,
        {
          data: SENT_DATA as never,
          sentAt,
          sentBy: { userId: "u1", email: "asha@studio.in" },
        },
        null,
      ),
    ).toBe(true);
    expect(
      (await portalRepo.findPortalState(ws, p.id))?.portal?.tokenHash,
    ).toBe(p.portal.tokenHash);

    // An answer to the old version (old sentAt) is refused and rolled back.
    const before = await collection("approvals").countDocuments({
      workspaceId: ws,
    });
    await expect(decide(ws, p, "approved")).rejects.toThrow("stale");
    expect(
      await collection("approvals").countDocuments({ workspaceId: ws }),
    ).toBe(before);

    // A replaced link can't decide either.
    await portalRepo.replacePortal(ws, p.id, newPortalLink());
    await expect(decide(ws, { ...p, sentAt }, "approved")).rejects.toThrow(
      "stale",
    );
    expect(
      await portalRepo.findByPortalTokenHash(p.portal.tokenHash),
    ).toBeNull();

    // Withdrawn: back to draft, can't be decided.
    expect(await portalRepo.markWithdrawn(ws, p.id)).toBe(true);
    expect(await portalRepo.markWithdrawn(ws, p.id)).toBe(false);
  });
});
