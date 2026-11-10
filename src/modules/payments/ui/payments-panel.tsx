import { nextStep } from "../domain/next-step";
import type { ScheduleItem } from "../domain/payment";
import { ScheduleRow, type ScheduleRowContext } from "./schedule-row";

export { PaymentStateBadge } from "./payment-state-badge";

/**
 * The project's payments once the scope is approved: each milestone (with
 * approved changes added) and separately billed changes, in order, with
 * what the client pays and what to do next. Totals live in the money strip
 * at the top of the page. Server component; the actions
 * are client pieces.
 */
export function PaymentsPanel({
  items,
  methodsReady,
  unlockedBy = {},
  stateFallback = null,
  ...ctx
}: Omit<ScheduleRowContext, "unlockedBy" | "stateFallback"> & {
  items: ScheduleItem[];
  /** False until at least one payment method is set up. */
  methodsReady: boolean;
  unlockedBy?: ScheduleRowContext["unlockedBy"];
  stateFallback?: ScheduleRowContext["stateFallback"];
}) {
  const rowCtx = { ...ctx, methodsReady, unlockedBy, stateFallback };
  // Asking for or confirming the next payment happens in the money strip;
  // its row points there instead of offering the same button twice.
  const step = nextStep(items);
  const above = step && step.kind !== "settled" ? step : null;
  return (
    <div className="grid gap-3">
      <ol className="divide-y rounded-xl border bg-background">
        {items.map((item, index) => (
          <ScheduleRow
            key={item.key}
            item={item}
            number={item.milestoneId ? index + 1 : null}
            ctx={rowCtx}
            actedAbove={above?.item.key === item.key ? above.kind : null}
          />
        ))}
      </ol>
    </div>
  );
}
