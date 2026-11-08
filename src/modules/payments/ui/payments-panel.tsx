import type { Route } from "next";
import Link from "next/link";
import type { ScheduleTotals } from "../domain/gst";
import type { ScheduleItem } from "../domain/payment";
import { PaymentTotals } from "./payment-totals";
import { ScheduleRow, type ScheduleRowContext } from "./schedule-row";

export { PaymentStateBadge } from "./payment-state-badge";

/**
 * The project's payments once the scope is approved: each milestone (with
 * approved changes added) and separately billed changes, in order, with
 * what the client pays and what to do next. Server component; the actions
 * are client pieces.
 */
export function PaymentsPanel({
  items,
  totals,
  methodsReady,
  unlockedBy = {},
  stateFallback = null,
  ...ctx
}: Omit<ScheduleRowContext, "unlockedBy" | "stateFallback"> & {
  items: ScheduleItem[];
  totals: ScheduleTotals;
  /** False until at least one payment method is set up. */
  methodsReady: boolean;
  unlockedBy?: ScheduleRowContext["unlockedBy"];
  stateFallback?: ScheduleRowContext["stateFallback"];
}) {
  const rowCtx = { ...ctx, unlockedBy, stateFallback };
  return (
    <div className="grid gap-3">
      {!methodsReady && (
        <p className="rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-pretty text-warning-ink">
          Add how you get paid (UPI, bank or a payment link) in{" "}
          <Link
            href={"/settings/payments" as Route}
            className="font-medium underline underline-offset-4"
          >
            Settings → Payments
          </Link>{" "}
          before asking for a payment, so {ctx.client.firstName} knows how to
          pay.
        </p>
      )}
      <ol className="divide-y rounded-xl border bg-background">
        {items.map((item, index) => (
          <ScheduleRow
            key={item.key}
            item={item}
            number={item.milestoneId ? index + 1 : null}
            ctx={rowCtx}
          />
        ))}
      </ol>
      <PaymentTotals totals={totals} currency={ctx.currency} />
    </div>
  );
}
