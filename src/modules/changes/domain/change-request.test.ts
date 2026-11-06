import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import {
  billingSummary,
  blankChangeValues,
  changeShareMessage,
  changeValuesFrom,
  changeValuesFromAddon,
  changeInputSchema,
  changeLabel,
  changeTotals,
  parseChangeNumber,
  placeChange,
  scheduleWithChanges,
  type MilestoneRef,
} from "./change-request";

const milestones: MilestoneRef[] = [
  { id: "m3", name: "Before launch", baseAmount: minor(3_840_000), order: 2 },
  { id: "m1", name: "Advance", baseAmount: minor(2_880_000), order: 0 },
  { id: "m2", name: "Design approved", baseAmount: minor(2_880_000), order: 1 },
];
const blog = minor(1_500_000); // ₹15,000

describe("CR numbers", () => {
  it("labels and parses", () => {
    expect(changeLabel(1)).toBe("CR-001");
    expect(changeLabel(1234)).toBe("CR-1234");
    expect(parseChangeNumber("CR-001")).toBe(1);
    expect(parseChangeNumber("cr-12")).toBe(12);
    expect(parseChangeNumber("7")).toBe(7);
    for (const bad of ["", "CR-", "CR-0", "abc", "1.5", "-1", "CR-1234567"]) {
      expect(parseChangeNumber(bad)).toBeNull();
    }
  });
});

describe("placeChange", () => {
  it("adds to the final payment (the done-when case)", () => {
    expect(
      placeChange(blog, { option: "final", milestoneId: null }, milestones),
    ).toEqual([{ milestoneId: "m3", amount: blog }]);
  });

  it("adds to the next unpaid payment, or a chosen one", () => {
    expect(
      placeChange(
        blog,
        { option: "next_milestone", milestoneId: null },
        milestones,
        ["m1"],
      ),
    ).toEqual([{ milestoneId: "m2", amount: blog }]);
    expect(
      placeChange(blog, { option: "milestone", milestoneId: "m2" }, milestones),
    ).toEqual([{ milestoneId: "m2", amount: blog }]);
  });

  it("splits in proportion and never loses a paisa", () => {
    const parts = placeChange(
      minor(1_000_001),
      { option: "split", milestoneId: null },
      milestones,
    );
    expect(parts.map((p) => p.milestoneId)).toEqual(["m1", "m2", "m3"]);
    expect(parts.reduce((s, p) => s + p.amount, 0)).toBe(1_000_001);
    expect(parts.map((p) => p.amount)).toEqual([300_000, 300_000, 400_001]);
  });

  it("is due now when asked, when the chosen payment is paid, or nothing is left", () => {
    const now = [{ milestoneId: null, amount: blog }];
    expect(
      placeChange(blog, { option: "pay_now", milestoneId: null }, milestones),
    ).toEqual(now);
    expect(
      placeChange(
        blog,
        { option: "milestone", milestoneId: "m1" },
        milestones,
        ["m1"],
      ),
    ).toEqual(now);
    expect(
      placeChange(blog, { option: "final", milestoneId: null }, milestones, [
        "m1",
        "m2",
        "m3",
      ]),
    ).toEqual(now);
  });
});

describe("scheduleWithChanges", () => {
  it("adds approved changes to their payments and lists separate ones", () => {
    const { rows, dueNow } = scheduleWithChanges(milestones, [
      {
        number: 2,
        total: minor(600_000),
        billing: { option: "pay_now", milestoneId: null },
      },
      {
        number: 1,
        total: blog,
        billing: { option: "final", milestoneId: null },
      },
    ]);
    expect(rows.map((r) => [r.name, r.total])).toEqual([
      ["Advance", 2_880_000],
      ["Design approved", 2_880_000],
      ["Before launch", 5_340_000],
    ]);
    expect(rows[2]?.additions).toEqual([{ label: "CR-001", amount: blog }]);
    expect(dueNow).toEqual([{ label: "CR-002", amount: 600_000 }]);
  });
});

describe("billingSummary and totals", () => {
  it("speaks plainly", () => {
    expect(
      billingSummary({ option: "final", milestoneId: null }, milestones),
    ).toBe("Added to the “Before launch” payment.");
    expect(
      billingSummary({ option: "milestone", milestoneId: "m2" }, milestones),
    ).toBe("Added to the “Design approved” payment.");
  });

  it("counts approved and pending only", () => {
    expect(
      changeTotals([
        { status: "approved", total: blog },
        { status: "sent", total: minor(600_000) },
        { status: "rejected", total: minor(100) },
        { status: "draft", total: minor(100) },
      ]),
    ).toEqual({ approved: blog, pending: 600_000 });
  });
});

describe("changeInputSchema", () => {
  const base = {
    title: "Blog + WhatsApp chat button",
    description: "",
    items: JSON.stringify([
      { title: "Blog categories", amount: "10,000" },
      { title: "WhatsApp button", amount: "5000" },
    ]),
    billingOption: "final",
    milestoneId: "",
    sourceChannel: "whatsapp",
    sourceNote: "",
  };

  it("parses a CR", () => {
    const parsed = changeInputSchema.parse(base);
    expect(parsed.items.map((i) => i.amount)).toEqual([1_000_000, 500_000]);
    expect(parsed).toMatchObject({
      description: null,
      sourceChannel: "whatsapp",
      milestoneId: null,
    });
  });

  it("needs a payment when 'specific payment' is chosen, and lines with prices", () => {
    const r = changeInputSchema.safeParse({
      ...base,
      billingOption: "milestone",
      items: "[]",
    });
    expect(r.error?.issues.map((i) => i.path.join(".")).sort()).toEqual([
      "items",
      "milestoneId",
    ]);
  });

  it("rejects unknown channels and bad amounts", () => {
    expect(
      changeInputSchema.safeParse({ ...base, sourceChannel: "fax" }).success,
    ).toBe(false);
    expect(
      changeInputSchema.safeParse({
        ...base,
        items: JSON.stringify([{ title: "x", amount: "abc" }]),
      }).success,
    ).toBe(false);
  });
});

describe("form values", () => {
  it("starts blank with the right billing for the model", () => {
    expect(blankChangeValues("milestones").billingOption).toBe("final");
    expect(blankChangeValues("upfront").billingOption).toBe("pay_now");
  });

  it("pre-fills from an add-on, spelling out the unit", () => {
    const v = changeValuesFromAddon(
      {
        title: "Extra page",
        description: "Any page in the same design.",
        amount: minor(600_000),
        unit: "/ page",
      },
      "milestones",
    );
    expect(v).toMatchObject({
      title: "Extra page",
      description: "Any page in the same design.",
      items: [{ title: "Extra page (per page)", amount: "6000" }],
    });
  });

  it("edits keep line ids; revisions start fresh lines", () => {
    const cr = {
      title: "Gallery page",
      description: null,
      items: [
        {
          id: "a",
          title: "Gallery",
          description: null,
          amount: minor(649_950),
        },
      ],
      billing: { option: "milestone" as const, milestoneId: "m2" },
      source: { channel: "whatsapp" as const, note: "Asked on 3 Nov" },
    };
    expect(changeValuesFrom(cr).items[0]).toEqual({
      id: "a",
      title: "Gallery",
      description: "",
      amount: "6499.5",
    });
    expect(changeValuesFrom(cr, { revise: true }).items[0]).not.toHaveProperty(
      "id",
    );
    expect(changeValuesFrom(cr)).toMatchObject({
      billingOption: "milestone",
      milestoneId: "m2",
      sourceChannel: "whatsapp",
    });
  });

  it("writes the WhatsApp message", () => {
    expect(
      changeShareMessage({
        clientFirstName: "Rahul",
        projectName: "Website redesign",
        title: "Blog",
        total: "₹15,000",
      }),
    ).toBe(
      "Hi Rahul, here's a change request for Website redesign: Blog (₹15,000). You can approve or decline it here:",
    );
  });
});
