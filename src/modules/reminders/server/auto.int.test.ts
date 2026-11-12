import { ObjectId } from "mongodb";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/shared/db/client";
import { collection } from "@/shared/db/collections";
import { ensureIndexes } from "@/shared/db/indexes";
import { sendEmail } from "@/shared/email";
import { runAutoReminders } from "./auto";

// The plan, the business name and the project come from other modules;
// here they're fixed, so the test is about the run and the payments.
vi.mock("@/shared/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/modules/billing/server", () => ({
  getWorkspacePlan: vi.fn(async (ws: string) => ({
    plan: { features: { automaticReminders: !ws.includes("free") } },
  })),
}));
vi.mock("@/modules/workspace/server", async (original) => ({
  ...(await original<object>()),
  getWorkspaceProfile: vi.fn(async () => ({ businessName: "Asha Designs" })),
}));
vi.mock("@/modules/projects/server", async (original) => ({
  ...(await original<object>()),
  findReminderTarget: vi.fn(async () => ({
    name: "Website redesign",
    currency: "INR",
    archived: false,
    client: { name: "Rahul Mehta", email: "rahul@mehta.in" },
    portalUrl: "https://scopelock.test/c/token",
  })),
}));

const send = vi.mocked(sendEmail);
const DAY = 24 * 60 * 60 * 1000;
/** 10:30 am in India on 21 Nov 2026. */
const now = new Date("2026-11-21T10:30:00+05:30");

beforeAll(async () => {
  await ensureIndexes(db());
});
beforeEach(() => {
  send.mockReset();
});

/** A payment asked for `daysAgo` days before `now`, still due. */
async function duePayment(ws: string, daysAgo: number, extra: object = {}) {
  const _id = new ObjectId();
  const at = new Date(now.getTime() - daysAgo * DAY);
  await collection("payments").insertOne({
    _id,
    workspaceId: ws,
    projectId: new ObjectId(),
    key: `m-${_id.toHexString()}`,
    label: "Before launch",
    lines: [],
    amount: 4_700_000,
    currency: "INR",
    status: "due",
    open: true,
    requestedAt: at,
    requestedBy: { userId: "u1", name: "Asha Menon" },
    report: null,
    confirmation: null,
    history: [
      { status: "due", at, by: { kind: "member", name: "Asha" }, note: null },
    ],
    createdAt: at,
    updatedAt: at,
    ...extra,
  });
  return _id;
}

const sentOf = async (id: ObjectId) =>
  (
    await collection<{ autoReminders?: { sent?: Date[] } }>("payments").findOne(
      { _id: id },
    )
  )?.autoReminders?.sent ?? [];

describe("runAutoReminders", () => {
  it("emails the client on day 3, once, however often it runs", async () => {
    const ws = "ws_auto_once";
    const id = await duePayment(ws, 3);
    const first = await runAutoReminders(now);
    expect(first.sent).toBeGreaterThanOrEqual(1);
    const mine = send.mock.calls.filter(([m]) => m.to === "rahul@mehta.in");
    expect(mine.length).toBeGreaterThanOrEqual(1);
    expect(send.mock.calls.at(-1)?.[0].subject).toBe(
      "Reminder: ₹47,000 due for Website redesign",
    );
    expect(await sentOf(id)).toHaveLength(1);

    send.mockReset();
    await runAutoReminders(now);
    await runAutoReminders(new Date(now.getTime() + 3 * 60 * 60 * 1000));
    expect(await sentOf(id)).toHaveLength(1);

    const logged = await collection("activity").findOne({
      workspaceId: ws,
      type: "reminder.auto_emailed",
    });
    expect(logged?.actor).toEqual({ kind: "system" });
    expect(logged?.data).toEqual({ title: "the Before launch payment" });
  });

  it("two runs at the same moment still send one", async () => {
    const id = await duePayment("ws_auto_race", 3);
    await Promise.all([runAutoReminders(now), runAutoReminders(now)]);
    expect(await sentOf(id)).toHaveLength(1);
  });

  it("waits for day 3, and sends the next on day 7", async () => {
    const early = await duePayment("ws_auto_days", 2);
    await runAutoReminders(now);
    expect(await sentOf(early)).toHaveLength(0);

    const later = await duePayment("ws_auto_days", 7, {
      autoReminders: { sent: [new Date(now.getTime() - 4 * DAY)] },
    });
    await runAutoReminders(now);
    expect(await sentOf(later)).toHaveLength(2);
  });

  it("sends nothing on Free, when paused, switched off, or at night", async () => {
    const free = await duePayment("ws_auto_free", 5);
    const paused = await duePayment("ws_auto_paused", 5, {
      autoReminders: { paused: true },
    });
    const off = await duePayment("ws_auto_off", 5);
    await collection("paymentSettings").insertOne({
      workspaceId: "ws_auto_off",
      autoReminders: false,
      createdAt: now,
      updatedAt: now,
    });
    await runAutoReminders(now);
    expect(await sentOf(free)).toHaveLength(0);
    expect(await sentOf(paused)).toHaveLength(0);
    expect(await sentOf(off)).toHaveLength(0);

    const night = await duePayment("ws_auto_night", 5);
    const run = await runAutoReminders(new Date("2026-11-21T22:00:00+05:30"));
    expect(run.outsideHours).toBe(true);
    expect(await sentOf(night)).toHaveLength(0);
  });

  it("gives the reminder back when the email fails, to try again", async () => {
    const id = await duePayment("ws_auto_fail", 4);
    send.mockRejectedValue(new Error("SMTP down"));
    const run = await runAutoReminders(now);
    expect(run.failed).toBeGreaterThanOrEqual(1);
    expect(await sentOf(id)).toHaveLength(0);
  });

  it("asks for what the client pays, GST included", async () => {
    await duePayment("ws_auto_gst", 3, { tax: 846_000 });
    await runAutoReminders(now);
    const mail = send.mock.calls.find(([m]) => m.subject.includes("₹55,460"));
    expect(mail?.[0].subject).toBe(
      "Reminder: ₹55,460 due for Website redesign",
    );
  });
});
