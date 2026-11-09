import { Check } from "lucide-react";
import Link from "next/link";
import { PLANS, type Plan } from "@/modules/billing";
import { formatINR } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export function PricingCards({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4 lg:grid-cols-3", className)}>
      {PLANS.map((plan) => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-background p-6 sm:p-7",
        plan.highlighted && "border-foreground/80",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{plan.summary}</p>

      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="text-[40px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
          {formatINR(plan.monthlyPrice)}
        </span>
        <span className="text-sm text-muted-foreground">
          {plan.monthlyPrice === 0 ? "/ month" : "/ month, planned"}
        </span>
      </p>

      <Button
        asChild
        size="lg"
        variant={plan.highlighted ? "default" : "outline"}
        className="mt-6 w-full max-sm:h-11"
      >
        <Link href="/sign-up">{plan.cta}</Link>
      </Button>

      <ul className="mt-7 grid gap-2.5 border-t pt-6 text-[14.5px]">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex gap-2.5">
            <Check
              className="mt-1 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span>
              {feature.label}
              {feature.soon && (
                <span className="ml-1.5 rounded border px-1 py-px text-[11px] text-muted-foreground">
                  soon
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
