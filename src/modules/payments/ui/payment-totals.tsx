import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, type Minor } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import type { ScheduleTotals } from "../domain/gst";

/** Under the payments: received, due now and the total, with GST if any. */
export function PaymentTotals({
  totals,
  currency,
}: {
  totals: ScheduleTotals;
  currency: CurrencyCode;
}) {
  const money = (amount: Minor) => formatMoney(amount, currency);
  const shown = totals.gst ?? totals;
  return (
    <dl className="flex flex-wrap justify-end gap-x-6 gap-y-1 px-1 text-sm tabular-nums">
      <div className="flex gap-1.5">
        <dt className="text-muted-foreground">Received</dt>
        <dd className="font-medium">{money(shown.received)}</dd>
      </div>
      <div className="flex gap-1.5">
        <dt className="text-muted-foreground">Due now</dt>
        <dd className={cn("font-medium", shown.due > 0 && "text-warning-ink")}>
          {money(shown.due)}
        </dd>
      </div>
      <div className="flex gap-1.5">
        <dt className="text-muted-foreground">
          {totals.gst ? "Total with GST" : "Total"}
        </dt>
        <dd className="font-semibold">{money(shown.total)}</dd>
      </div>
    </dl>
  );
}
