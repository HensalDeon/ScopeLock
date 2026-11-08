import { describe, expect, it } from "vitest";
import { formatINR, minor } from "@/shared/lib/money";
import { percentTotal, splitByMilestones } from "./billing";
import { buildProjectPlan, projectInputSchema } from "./project-input";
import { isEditable, isScopeApproved, proposalShareMessage } from "./project";
import { paymentTimings, unlockingSteps } from "./payment-timing";
import { EMPTY_PROPOSAL } from "./proposal";
import { draftTotal } from "./scope";

const CLIENT = "6728f0c2a1b2c3d4e5f60718";
let counter = 0;
const newId = () => `id-${++counter}`;

/** The project from the plan's "done when": Rahul, ₹80,000, 5 pages, 30/30/40. */
const rahul = {
  clientId: CLIENT,
  currency: "INR",
  name: "Website redesign",
  description: "5-page site for Mehta Interiors",
  items: JSON.stringify([
    { title: "Home page", amount: "20,000" },
    { title: "About page", amount: "12000" },
    { title: "Services page", amount: "16,000" },
    { title: "Portfolio page", amount: "20,000" },
    { title: "Contact page", amount: "12,000" },
  ]),
  billingModel: "milestones",
  milestones: JSON.stringify([
    { name: "Advance", percent: 30 },
    { name: "Design approved", percent: "30" },
    { name: "Before launch", percent: 40 },
  ]),
};

describe("projectInputSchema", () => {
  it("accepts Rahul's project and converts rupees to paise", () => {
    const input = projectInputSchema.parse(rahul);
    expect(input.items.map((i) => i.amount)).toEqual([
      2_000_000, 1_200_000, 1_600_000, 2_000_000, 1_200_000,
    ]);
    expect(input.milestones.map((m) => m.percent)).toEqual([30, 30, 40]);
  });

  it("requires milestones to add up to exactly 100%", () => {
    const result = projectInputSchema.safeParse({
      ...rahul,
      milestones: JSON.stringify([
        { name: "Advance", percent: 30 },
        { name: "Launch", percent: 60 },
      ]),
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0]).toMatchObject({
      path: ["milestones"],
      message:
        "The payments add up to 90%. They need to add up to exactly 100%.",
    });
  });

  it("ignores milestones when billing is upfront", () => {
    const input = projectInputSchema.parse({
      ...rahul,
      billingModel: "upfront",
      milestones: "[]",
    });
    expect(input.billingModel).toBe("upfront");
  });

  it("points each bad scope line at its own field", () => {
    const result = projectInputSchema.safeParse({
      ...rahul,
      items: JSON.stringify([
        { title: "", amount: "5000" },
        { title: "Logo", amount: "abc" },
        { title: "Hosting", amount: "0" },
      ]),
    });
    const issues = result.error!.issues.map((i) => [
      i.path.join("."),
      i.message,
    ]);
    expect(issues).toEqual([
      ["items.0.title", "Describe the deliverable."],
      ["items.1.amount", "Use numbers only, like 12000 or 12,000.50."],
      ["items.2.amount", "The amount must be more than 0."],
    ]);
  });

  it("needs at least one scope line and a client", () => {
    const result = projectInputSchema.safeParse({
      ...rahul,
      clientId: "",
      items: "[]",
    });
    const paths = result.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["clientId", "items"]));
  });

  it("rejects a tampered form instead of crashing", () => {
    expect(
      projectInputSchema.safeParse({ ...rahul, items: "{not json" }).success,
    ).toBe(false);
    expect(
      projectInputSchema.safeParse({ ...rahul, clientId: '{"$ne":null}' })
        .success,
    ).toBe(false);
  });
});

describe("buildProjectPlan", () => {
  it("builds Rahul's ₹80,000 plan split 30/30/40", () => {
    const plan = buildProjectPlan(projectInputSchema.parse(rahul), newId);
    expect(formatINR(plan.total)).toBe("₹80,000");
    expect(
      plan.milestones.map((m) => [m.name, m.percent, formatINR(m.baseAmount)]),
    ).toEqual([
      ["Advance", 30, "₹24,000"],
      ["Design approved", 30, "₹24,000"],
      ["Before launch", 40, "₹32,000"],
    ]);
    expect(plan.milestones.map((m) => m.order)).toEqual([0, 1, 2]);
    expect(new Set(plan.items.map((i) => i.id)).size).toBe(5);
  });

  it("never loses a paisa on awkward splits", () => {
    const total = minor(1_000_01); // ₹1,000.01
    const parts = splitByMilestones(total, [
      { percent: 33 },
      { percent: 33 },
      { percent: 34 },
    ]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
  });

  it("stores upfront billing as a single 100% payment", () => {
    const plan = buildProjectPlan(
      projectInputSchema.parse({
        ...rahul,
        billingModel: "upfront",
        milestones: "[]",
      }),
      newId,
    );
    expect(plan.milestones).toEqual([
      expect.objectContaining({
        name: "Full payment",
        percent: 100,
        baseAmount: 8_000_000,
      }),
    ]);
  });

  it("keeps existing ids when editing", () => {
    const id = "0b0e2c1a-6d1e-4f7a-9a5b-1c2d3e4f5a6b";
    const plan = buildProjectPlan(
      projectInputSchema.parse({
        ...rahul,
        items: JSON.stringify([{ id, title: "Home page", amount: "20000" }]),
      }),
      newId,
    );
    expect(plan.items[0]?.id).toBe(id);
  });
});

describe("helpers", () => {
  it("totals half-typed amounts without throwing", () => {
    expect(draftTotal(["20,000", "12.5", "", "abc", "-5"])).toBe(2_001_250);
  });

  it("adds percentages and knows what's editable", () => {
    expect(percentTotal([{ percent: 30 }, { percent: 70 }])).toBe(100);
    expect(isEditable("draft")).toBe(true);
    expect(isEditable("awaiting_approval")).toBe(false);
  });
});

describe("project currency", () => {
  it("is required and must be supported", () => {
    const { currency: _drop, ...noCurrency } = rahul;
    void _drop;
    expect(projectInputSchema.safeParse(noCurrency).success).toBe(false);
    expect(
      projectInputSchema.safeParse({ ...rahul, currency: "BTC" }).success,
    ).toBe(false);
  });

  it("splits a USD project the same way: cents, never lost", () => {
    const plan = buildProjectPlan(
      projectInputSchema.parse({
        ...rahul,
        currency: "USD",
        items: JSON.stringify([{ title: "Website", amount: "2,400.01" }]),
      }),
      newId,
    );
    expect(plan.total).toBe(240_001);
    expect(plan.milestones.reduce((a, m) => a + m.baseAmount, 0)).toBe(240_001);
  });
});

describe("status helpers and share text", () => {
  it("knows when the scope is approved", () => {
    expect(isScopeApproved("active")).toBe(true);
    expect(isScopeApproved("completed")).toBe(true);
    expect(isScopeApproved("awaiting_approval")).toBe(false);
    expect(isScopeApproved("draft")).toBe(false);
  });

  it("writes the WhatsApp message", () => {
    expect(
      proposalShareMessage({
        clientFirstName: "Rahul",
        projectName: "Website redesign",
        total: "₹80,000",
      }),
    ).toBe(
      "Hi Rahul, here's the proposal for Website redesign (₹80,000). You can read it and approve it here:",
    );
  });
});

describe("payment timings", () => {
  const step = (
    phase: string,
    duration: string | null,
    paymentOrder: number | null,
    isMilestone = true,
  ) => ({
    phase,
    duration,
    isMilestone,
    paymentOrder,
  });
  it("names the step that unlocks each payment; an unlinked first one is the advance", () => {
    expect(
      paymentTimings(3, [
        step("Discovery", "Week 1", null, false),
        step("Design", "Week 2", 1),
        step("Launch", null, 2),
      ]),
    ).toEqual([
      { step: null, dueWhen: "Before work starts" },
      {
        step: { phase: "Design", duration: "Week 2" },
        dueWhen: "After Design (Week 2)",
      },
      { step: { phase: "Launch", duration: null }, dueWhen: "After Launch" },
    ]);
  });

  it("ignores links on non-milestone steps and older steps without a link", () => {
    expect(
      paymentTimings(2, [
        step("Design", null, 1, false),
        { phase: "Old", duration: null, isMilestone: true },
      ]),
    ).toEqual([
      { step: null, dueWhen: "Before work starts" },
      { step: null, dueWhen: null },
    ]);
  });

  it("drops links to payments that don't exist, or twice to the same one", () => {
    const plan = buildProjectPlan(
      {
        items: [
          {
            title: "Site",
            description: null,
            includes: [],
            amount: minor(1_000_000),
          },
        ],
        billingModel: "milestones",
        milestones: [
          { name: "Advance", percent: 50 },
          { name: "Launch", percent: 50 },
        ],
        proposal: {
          ...EMPTY_PROPOSAL,
          timeline: [
            {
              phase: "Design",
              duration: null,
              description: null,
              isMilestone: true,
              paymentOrder: 1,
            },
            {
              phase: "Again",
              duration: null,
              description: null,
              isMilestone: true,
              paymentOrder: 1,
            },
            {
              phase: "Ghost",
              duration: null,
              description: null,
              isMilestone: true,
              paymentOrder: 5,
            },
          ],
        },
      },
      newId,
    );
    expect(plan.proposal.timeline.map((s) => s.paymentOrder)).toEqual([
      1,
      null,
      null,
    ]);
  });
});

describe("unlockingSteps", () => {
  it("maps each payment to the milestone step that unlocks it", () => {
    expect(
      unlockingSteps({
        milestones: [
          {
            id: "m2",
            name: "Launch",
            percent: 50,
            baseAmount: minor(1),
            order: 1,
          },
          {
            id: "m1",
            name: "Advance",
            percent: 50,
            baseAmount: minor(1),
            order: 0,
          },
        ],
        proposal: {
          ...EMPTY_PROPOSAL,
          timeline: [
            {
              id: "t",
              phase: "Testing & launch",
              duration: null,
              description: null,
              isMilestone: true,
              paymentOrder: 1,
            },
          ],
        },
      }),
    ).toEqual({ m2: "Testing & launch" });
  });
});
