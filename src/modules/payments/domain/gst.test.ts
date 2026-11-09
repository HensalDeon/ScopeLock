import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import { scheduleTotals, withGst } from "./gst";
import type { Payment, ScheduleItem } from "./payment";

const item = (
  key: string,
  total: number,
  state: ScheduleItem["state"] = "upcoming",
  tax = 0,
): ScheduleItem => ({
  key,
  label: key,
  milestoneId: key,
  percent: null,
  lines: [],
  total: minor(total),
  tax: minor(tax),
  payable: minor(total + tax),
  taxSplit: null,
  payment: state === "upcoming" ? null : ({ id: key } as Payment),
  state,
});
const cgst = (amount: number) => ({
  tax: minor(Math.round(amount * 0.18)),
  split: "CGST 9% + SGST 9%",
});

describe("withGst", () => {
  it("adds what the invoice will charge to payments not asked for yet", () => {
    const [asked, next] = withGst(
      [item("adv", 2_880_000, "received", 518_400), item("design", 2_880_000)],
      cgst,
    );
    expect(asked?.payable).toBe(3_398_400); // from its invoice, untouched
    expect(next).toMatchObject({
      tax: 518_400,
      payable: 3_398_400,
      taxSplit: "CGST 9% + SGST 9%",
    });
  });

  it("leaves everything as is when no GST applies", () => {
    const items = [item("adv", 2_880_000)];
    expect(withGst(items, () => null)).toEqual(items);
  });
});

describe("scheduleTotals", () => {
  it("adds up received, due and total, before GST and with it", () => {
    const totals = scheduleTotals([
      item("adv", 2_880_000, "received", 518_400),
      item("design", 2_880_000, "due", 518_400),
      item("launch", 5_340_000, "upcoming", 961_200),
    ]);
    expect(totals).toEqual({
      received: 2_880_000,
      due: 2_880_000,
      total: 11_100_000,
      gst: {
        tax: 1_998_000,
        received: 3_398_400,
        due: 3_398_400,
        total: 13_098_000,
      },
    });
  });

  it("no GST anywhere: no GST figures", () => {
    expect(scheduleTotals([item("adv", 2_400_000, "received")]).gst).toBeNull();
  });
});
