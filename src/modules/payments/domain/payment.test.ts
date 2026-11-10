import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import {
  buildSchedule,
  closedKeys,
  paymentTotals,
  type Payment,
  lineBreakdown,
} from "./payment";
import { notReceivedSchema, reportInputSchema } from "./payment-forms";

const milestones = [
  {
    id: "m1",
    name: "Advance",
    percent: 30,
    baseAmount: minor(2_400_000),
    order: 0,
  },
  {
    id: "m2",
    name: "Design approved",
    percent: 30,
    baseAmount: minor(2_400_000),
    order: 1,
  },
  {
    id: "m3",
    name: "Before launch",
    percent: 40,
    baseAmount: minor(3_200_000),
    order: 2,
  },
];
const blog = {
  id: "c1",
  label: "CR-001",
  title: "Blog + WhatsApp chat button",
  placement: [{ milestoneId: "m3", amount: minor(1_500_000) }],
};
const payment = (p: Partial<Payment>): Payment => ({
  id: "pay1",
  projectId: "p1",
  key: "m1",
  label: "Advance",
  lines: [],
  amount: minor(2_400_000),
  tax: minor(0),
  payable: minor(2_400_000),
  invoice: null,
  currency: "INR",
  status: "due",
  requestedAt: new Date(),
  report: null,
  confirmation: null,
  lastRejection: null,
  ...p,
});
const base = {
  milestones,
  baselineTotal: minor(8_000_000),
  currency: "INR" as const,
};

describe("buildSchedule", () => {
  it("adds an approved change to its payment: the done-when ₹47,000", () => {
    const items = buildSchedule({ ...base, changes: [blog], payments: [] });
    expect(items.map((i) => [i.label, i.total, i.state])).toEqual([
      ["Advance", 2_400_000, "upcoming"],
      ["Design approved", 2_400_000, "upcoming"],
      ["Before launch", 4_700_000, "upcoming"],
    ]);
    expect(items[2]?.lines.map((l) => l.description)).toEqual([
      "40% of the agreed ₹80,000",
      "CR-001 Blog + WhatsApp chat button",
    ]);
  });

  it("shows a requested payment exactly as it was asked for", () => {
    const frozen = payment({
      key: "m3",
      lines: [
        {
          kind: "baseline",
          refId: "m3",
          description: "40% of the agreed ₹80,000",
          amount: minor(3_200_000),
        },
      ],
      amount: minor(3_200_000),
      status: "client_reported",
    });
    // A change approved later says "m3", but the request was already sent.
    const [, , last] = buildSchedule({
      ...base,
      changes: [blog],
      payments: [frozen],
    });
    expect(last).toMatchObject({
      total: 3_200_000,
      state: "client_reported",
      payment: { id: "pay1" },
    });
  });

  it("lists separately-paid changes after the milestones; cancelled requests free the slot", () => {
    const gallery = {
      id: "c2",
      label: "CR-002",
      title: "Gallery page",
      placement: [{ milestoneId: null, amount: minor(600_000) }],
    };
    const items = buildSchedule({
      ...base,
      changes: [blog, gallery],
      payments: [
        payment({ key: "m1", status: "cancelled" }),
        payment({ id: "pay2", key: "m2", status: "confirmed" }),
      ],
    });
    expect(items.map((i) => [i.key, i.state])).toEqual([
      ["m1", "upcoming"],
      ["m2", "received"],
      ["m3", "upcoming"],
      ["cr:c2", "upcoming"],
    ]);
    expect(items[3]).toMatchObject({
      label: "CR-002 Gallery page",
      total: 600_000,
      milestoneId: null,
    });
  });

  it("calls a single upfront payment the agreed scope", () => {
    const [only] = buildSchedule({
      milestones: [
        {
          id: "u",
          name: "Full payment",
          percent: 100,
          baseAmount: minor(1_800_000),
          order: 0,
        },
      ],
      baselineTotal: minor(1_800_000),
      currency: "INR",
      changes: [],
      payments: [],
    });
    expect(only?.lines[0]?.description).toBe("Agreed scope (₹18,000)");
  });
});

describe("totals and closed slots", () => {
  it("counts received and still-owed amounts, GST included", () => {
    expect(
      paymentTotals([
        payment({ status: "confirmed", payable: minor(2_832_000) }),
        payment({ status: "client_reported", payable: minor(4_700_000) }),
        payment({ status: "due", payable: minor(100) }),
        payment({ status: "cancelled", payable: minor(999) }),
      ]),
    ).toEqual({ received: 2_832_000, due: 4_700_100 });
    expect(
      closedKeys([
        payment({ key: "m1" }),
        payment({ key: "m2", status: "cancelled" }),
      ]),
    ).toEqual(["m1"]);
  });
});

describe("what people type", () => {
  const schema = reportInputSchema("2026-11-07");
  it("accepts a UPI payment with its UTR", () => {
    expect(
      schema.parse({
        method: "upi",
        reference: " 431209876543 ",
        paidOn: "2026-11-07",
        note: "",
      }),
    ).toEqual({
      method: "upi",
      reference: "431209876543",
      paidOn: "2026-11-07",
      note: null,
    });
  });
  it("rejects future dates, missing references and odd characters", () => {
    expect(
      schema.safeParse({
        method: "upi",
        reference: "4312",
        paidOn: "2026-11-08",
        note: "",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        method: "bank",
        reference: "",
        paidOn: "2026-11-01",
        note: "",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        method: "upi",
        reference: "<script>",
        paidOn: "2026-11-01",
        note: "",
      }).success,
    ).toBe(false);
    expect(notReceivedSchema.safeParse({ note: "" }).success).toBe(false);
  });
});

describe("lineBreakdown", () => {
  const rupees = (n: number) => `₹${(n / 100).toLocaleString("en-IN")}`;
  it("says what a combined payment is made of", () => {
    expect(
      lineBreakdown(
        [
          {
            kind: "baseline",
            description: "40% of the agreed ₹32,000",
            amount: minor(1_280_000),
          },
          {
            kind: "change_request",
            description: "CR-001 Blog",
            amount: minor(1_500_000),
          },
        ],
        rupees,
      ),
    ).toBe("₹12,800 agreed + ₹15,000 CR-001");
    expect(
      lineBreakdown(
        [{ kind: "baseline", description: "x", amount: minor(1) }],
        rupees,
      ),
    ).toBeNull();
  });
});
