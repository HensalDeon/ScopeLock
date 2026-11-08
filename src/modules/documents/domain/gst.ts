import { percentOf, sum, type Minor } from "@/shared/lib/money";

/**
 * GST figures on proposals and change requests, from the rate saved in what
 * was sent. Worked out per payment (each payment is its own invoice), with
 * the invoices' rounding, so the totals match what the client is billed.
 */
export function withGst(
  amount: Minor,
  percent: number | null | undefined,
): Minor | null {
  return percent ? sum([amount, percentOf(amount, percent)]) : null;
}

/** GST over several payments, and the total with it. Null when no GST. */
export function gstOver(
  amounts: readonly Minor[],
  percent: number | null | undefined,
): { tax: Minor; total: Minor } | null {
  if (!percent) return null;
  const tax = sum(amounts.map((a) => percentOf(a, percent)));
  return { tax, total: sum([...amounts, tax]) };
}
