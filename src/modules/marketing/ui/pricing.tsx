import { Check } from "lucide-react";
import Link from "next/link";
import { PLANS, type Plan } from "@/modules/billing";
import { formatINR, paise } from "@/shared/lib/money";
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
  const href =
    plan.id === "free"
      ? "/sign-up"
      : (`/sign-up?plan=${plan.id}` as `/sign-up?plan=${string}`);
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-background p-6 sm:p-7",
        plan.highlighted &&
          "border-foreground/80 shadow-[0_20px_50px_-28px_rgba(11,18,32,0.35)]",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
        {plan.highlighted && (
          <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[11.5px] font-medium text-background">
            Recommended
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{plan.summary}</p>

      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="text-[40px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
          {formatINR(paise(plan.monthlyPrice))}
        </span>
        <span className="text-sm text-muted-foreground">
          {plan.monthlyPrice === 0 ? "forever" : "/ month"}
        </span>
      </p>

      <Button
        asChild
        size="lg"
        variant={plan.highlighted ? "default" : "outline"}
        className="mt-6 w-full"
      >
        <Link href={href}>{plan.cta}</Link>
      </Button>

      <ul className="mt-7 grid gap-2.5 border-t pt-6 text-[14.5px]">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex gap-2.5">
            <Check className="mt-1 size-4 shrink-0 text-brand" aria-hidden />
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
