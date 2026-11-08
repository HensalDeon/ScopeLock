import { cn } from "@/shared/lib/utils";
import type { ScheduleState } from "../domain/payment";
import { PAYMENT_STATE_LABELS } from "../domain/payment-forms";

const STATE_STYLES: Record<ScheduleState, string> = {
  upcoming: "border-border bg-muted text-muted-foreground",
  due: "border-warning/25 bg-warning-soft text-warning-ink",
  client_reported: "border-warning/40 bg-warning-soft text-warning-ink",
  received: "border-brand/25 bg-success-soft text-foreground",
};

export function PaymentStateBadge({ state }: { state: ScheduleState }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
        STATE_STYLES[state],
      )}
    >
      {state !== "upcoming" && (
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            state === "received" ? "bg-brand" : "bg-warning",
          )}
        />
      )}
      {PAYMENT_STATE_LABELS[state]}
    </span>
  );
}
