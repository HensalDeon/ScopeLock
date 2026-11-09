import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, percentOf, sum, type Minor } from "@/shared/lib/money";

/**
 * Under a form's total, when invoices to this client carry GST: what it
 * adds and what the client will see, so the price is never a surprise.
 */
export function GstTotalNote({
  amount,
  percent,
  currency,
  who = "Your client",
}: {
  amount: Minor;
  /** 18, or null when no GST applies (nothing is shown). */
  percent: number | null;
  currency: CurrencyCode;
  who?: string;
}) {
  if (!percent || amount <= 0) return null;
  const tax = percentOf(amount, percent);
  return (
    <p className="text-sm text-muted-foreground tabular-nums">
      Plus {percent}% GST ({formatMoney(tax, currency)}). {who} sees{" "}
      <span className="font-medium text-foreground">
        {formatMoney(sum([amount, tax]), currency)}
      </span>
      .
    </p>
  );
}
