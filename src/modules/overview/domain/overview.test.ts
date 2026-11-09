import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import { needsYou } from "./needs-you";
import {
  reminderLink,
  waitingOnClients,
  type OverviewChange,
  type OverviewProject,
} from "./overview";
import { setupSteps } from "./setup";

const now = new Date("2026-11-06T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const project = (p: Partial<OverviewProject>): OverviewProject => ({
  id: "p1",
  name: "Website redesign",
  status: "active",
  currency: "INR",
  baselineTotal: minor(8_300_000),
  totals: {
    approvedChanges: minor(0),
    pendingChanges: minor(0),
    paid: minor(0),
    due: minor(0),
  },
  client: { name: "Rahul Mehta", phone: "+919876543210" },
  sentAt: null,
  lastDecision: null,
  updatedAt: daysAgo(1),
  changeCount: 0,
  ...p,
});
const change = (c: Partial<OverviewChange>): OverviewChange => ({
  id: "c1",
  projectId: "p1",
  number: 2,
  label: "CR-002",
  title: "Gallery page",
  total: minor(600_000),
  status: "sent",
  everSent: true,
  sentAt: daysAgo(3),
  updatedAt: daysAgo(3),
  ...c,
});

describe("waitingOnClients", () => {
  it("lists proposals and CRs, longest wait first, with a reminder", () => {
    const projects = [
      project({}),
      project({
        id: "p2",
        name: "Landing page",
        status: "awaiting_approval",
        sentAt: daysAgo(1),
        client: { name: "Arjun Rao", phone: null },
      }),
    ];
    const items = waitingOnClients(
      projects,
      [change({})],
      new Map([
        ["p1", "https://x.in/c/abc"],
        ["p2", "https://x.in/c/def"],
      ]),
      now,
    );
    expect(items.map((i) => i.tag)).toEqual(["CR-002", "Proposal"]);
    expect(items[0]).toMatchObject({
      title: "Gallery page",
      detail: "Website redesign · sent 3 days ago",
      amount: "₹6,000",
      href: "/projects/p1/changes/2",
    });
    expect(decodeURIComponent(items[0]?.remind ?? "")).toContain(
      "https://x.in/c/abc/changes/2",
    );
    expect(items[0]?.remind).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
    // No phone: WhatsApp asks who to send it to.
    expect(items[1]?.remind).toMatch(/^https:\/\/wa\.me\/\?text=Hi%20Arjun/);
  });

  it("offers no reminder without a working link", () => {
    const items = waitingOnClients(
      [project({})],
      [change({})],
      new Map([["p1", null]]),
      now,
    );
    expect(items[0]?.remind).toBeNull();
    expect(reminderLink(null, null, "hi")).toBeNull();
  });
});

describe("needsYou", () => {
  it("puts changes the client asked for first, then drafts", () => {
    const items = needsYou(
      [
        project({
          id: "d1",
          name: "Shop",
          status: "draft",
          updatedAt: daysAgo(0),
        }),
        project({
          id: "d2",
          name: "Redesign",
          status: "draft",
          sentAt: daysAgo(2),
          lastDecision: {
            decision: "rejected",
            at: daysAgo(1),
            name: "Rahul Mehta",
            comment: "Add a blog",
          },
          updatedAt: daysAgo(5),
        }),
      ],
      [
        change({
          status: "draft",
          everSent: false,
          projectId: "d1",
          label: "CR-001",
          number: 1,
        }),
      ],
      now,
    );
    expect(items.map((i) => i.tag)).toEqual([
      "Changes asked",
      "Draft",
      "CR-001 · Draft",
    ]);
    expect(items[0]).toMatchObject({
      quote: "Add a blog",
      detail: "Rahul Mehta asked yesterday · edit and send again",
    });
  });

  it("calls a sent-then-withdrawn draft 'Taken back'", () => {
    const [item] = needsYou(
      [project({ status: "draft", sentAt: daysAgo(2) })],
      [],
      now,
    );
    expect(item).toMatchObject({
      tag: "Taken back",
      detail: "Rahul Mehta · not sent again yet",
    });
  });
});

describe("setupSteps", () => {
  it("ticks steps from what exists", () => {
    const steps = setupSteps({
      businessName: "Deon Digital",
      businessTypeTitle: "Freelancer",
      clientCount: 1,
      paymentsReady: false,
      projects: [{ id: "p1", status: "active", changeCount: 0 }],
    });
    expect(steps.map((s) => s.done)).toEqual([
      true,
      true,
      false,
      true,
      true,
      false,
    ]);
    expect(steps[2]?.href).toBe("/settings/payments");
    // Logging an extra request goes to the approved project's new CR page.
    expect(steps[5]?.href).toBe("/projects/p1/changes/new");
  });
});

describe("payments on the overview", () => {
  const due = {
    id: "pay1",
    projectId: "p1",
    label: "Before launch",
    amount: minor(4_700_000),
    status: "due" as const,
    requestedAt: daysAgo(2),
    reportedAt: null,
  };
  it("lists a due payment as waiting, with a reminder to the payment page", () => {
    const [item] = waitingOnClients(
      [project({})],
      [],
      new Map([["p1", "https://x.in/c/abc"]]),
      now,
      [due],
    );
    expect(item).toMatchObject({
      tag: "Payment due",
      title: "Before launch",
      amount: "₹47,000",
      detail: "Website redesign · asked 2 days ago",
    });
    expect(decodeURIComponent(item?.remind ?? "")).toContain(
      "https://x.in/c/abc/pay/pay1",
    );
  });

  it("puts 'client says paid' first under Needs you", () => {
    const items = needsYou(
      [project({}), project({ id: "d1", name: "Shop", status: "draft" })],
      [],
      now,
      [{ ...due, status: "client_reported", reportedAt: daysAgo(0) }],
    );
    expect(items.map((i) => i.tag)).toEqual(["Client says paid", "Draft"]);
    expect(items[0]?.detail).toBe(
      "Website redesign · Rahul Mehta paid today, 5:30 pm · check and confirm",
    );
  });

  it("raises the next payment nobody has asked for", () => {
    const money = (nextAsk: { label: string; amount: number } | null) => ({
      received: minor(0),
      due: minor(0),
      toAsk: minor(0),
      total: minor(0),
      tax: minor(0),
      nextAsk: nextAsk && { ...nextAsk, amount: minor(nextAsk.amount) },
    });
    expect(
      needsYou(
        [project({ money: money({ label: "Design", amount: 960_000 }) })],
        [],
        now,
      ),
    ).toEqual([
      expect.objectContaining({
        tag: "Next payment",
        title: "Design",
        amount: "₹9,600",
        detail: "Website redesign · not asked yet · ask Rahul when it's due",
      }),
    ]);
    // Something already out: it's waiting on the client, not on you.
    expect(needsYou([project({ money: money(null) })], [], now)).toEqual([]);
  });
});
