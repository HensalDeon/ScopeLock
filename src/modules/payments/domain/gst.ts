import { sum, type Minor } from "@/shared/lib/money";
import type { ScheduleItem, ScheduleState } from "./payment";

/**
 * GST on the payment schedule. A payment already asked for carries the GST
 * of its invoice; one not asked for yet gets what its invoice will add,
 * from `preview` (the invoices module's rule), so the figures shown before
 * and after asking always agree.
 */
export type TaxPreview = (
  amount: Minor,
) => { tax: Minor; split: string } | null;

export function withGst(
  items: readonly ScheduleItem[],
  preview: TaxPreview,
): ScheduleItem[] {
  return items.map((item) => {
    if (item.payment) return item;
    const gst = preview(item.total);
    return gst
      ? {
          ...item,
          tax: gst.tax,
          payable: sum([item.total, gst.tax]),
          taxSplit: gst.split,
        }
      : item;
  });
}

type Figures = { received: Minor; due: Minor; total: Minor };

export type ScheduleTotals = Figures & {
  /** The same with GST, or null when no payment carries any. */
  gst: (Figures & { tax: Minor }) | null;
};

const OWED: readonly ScheduleState[] = ["due", "client_reported"];

/** Received, due now and the whole schedule, before GST and with it. */
export function scheduleTotals(items: readonly ScheduleItem[]): ScheduleTotals {
  const add = (
    pick: (i: ScheduleItem) => Minor,
    only?: (i: ScheduleItem) => boolean,
  ) => sum((only ? items.filter(only) : items).map(pick));
  const received = (i: ScheduleItem) => i.state === "received";
  const owed = (i: ScheduleItem) => OWED.includes(i.state);
  const tax = add((i) => i.tax);
  return {
    received: add((i) => i.total, received),
    due: add((i) => i.total, owed),
    total: add((i) => i.total),
    gst:
      tax > 0
        ? {
            tax,
            received: add((i) => i.payable, received),
            due: add((i) => i.payable, owed),
            total: add((i) => i.payable),
          }
        : null,
  };
}
