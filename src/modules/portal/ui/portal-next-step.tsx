import { Check } from "lucide-react";
import Link from "next/link";
import { nextStep, type ScheduleItem } from "@/modules/payments";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";

/**
 * The client's one next step on an approved project, above the totals:
 * pay the payment that's due, wait while the freelancer checks a payment
 * they reported, or nothing to do (with when the next one comes).
 */
export function PortalNextStep({
  items,
  token,
  business,
  money,
}: {
  items: ScheduleItem[];
  token: string;
  business: string;
  money: (amount: number) => string;
}) {
  const step = nextStep(items);
  if (!step) return null;
  if (step.kind === "settled") {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-brand/25 bg-success-soft px-4 py-3 text-sm font-medium">
        <Check aria-hidden className="size-4 shrink-0 text-brand" />
        Every payment is in. Thank you.
      </p>
    );
  }
  const { item } = step;
  if (step.kind === "confirm") {
    return (
      <p className="rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-pretty text-warning-ink">
        You said you&apos;ve paid {item.label} ({money(item.payable)}).{" "}
        {business} will check and confirm.
      </p>
    );
  }
  if (step.kind === "waiting" && item.payment) {
    return (
      <div className="grid gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-4 sm:flex sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-pretty text-warning-ink">
          Next to pay: the “{item.label}” payment,{" "}
          <span className="tabular-nums">{money(item.payable)}</span>.
        </p>
        <Button asChild className={TOUCH}>
          <Link href={`/c/${token}/pay/${item.payment.id}`}>
            Pay {money(item.payable)}
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <p className="rounded-lg border px-4 py-3 text-sm text-pretty text-muted-foreground">
      Nothing to pay right now. Next: the “{item.label}” payment,{" "}
      <span className="tabular-nums">{money(item.payable)}</span>, when{" "}
      {business} asks for it.
    </p>
  );
}
