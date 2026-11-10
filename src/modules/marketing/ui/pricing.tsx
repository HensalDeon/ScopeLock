import type { Plan } from "@/modules/billing";
import { formatINR } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { DISPLAY } from "./primitives";

/**
 * The plans as a rate card: one ruled row per plan, the monthly price in the
 * figure column. Plans and prices come from the admin page (getPlans());
 * paid prices are planned until paid plans open.
 */
export function RateCard({
  plans,
  className,
  planHeading: Heading = "h3",
}: {
  plans: readonly Plan[];
  className?: string;
  /** "h2" when the card sits right under the page's h1 (/pricing). */
  planHeading?: "h2" | "h3";
}) {
  return (
    <div className={cn("border-t border-foreground", className)}>
      <div
        aria-hidden
        className="hidden grid-cols-[13rem_minmax(0,1fr)_11rem] gap-6 border-b py-2.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase md:grid"
      >
        <span>Plan</span>
        <span>Includes</span>
        <span className="text-right">Per month</span>
      </div>
      <ul aria-label="Plans">
        {plans.map((plan) => (
          <li
            key={plan.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-3 border-b py-6 md:grid-cols-[13rem_minmax(0,1fr)_11rem]"
          >
            <div className="grid content-start gap-1">
              <Heading
                className={`${DISPLAY} text-[26px] leading-none font-semibold`}
              >
                {plan.name}
              </Heading>
              <p className="text-[14px] text-pretty text-muted-foreground">
                {plan.summary}
              </p>
            </div>
            <ul className="col-span-full row-start-2 flex flex-wrap gap-x-5 gap-y-1.5 text-[15px] md:col-span-1 md:col-start-2 md:row-start-1 md:pt-1">
              {plan.highlights.map((f) => (
                <li key={f.label} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-1 shrink-0 rounded-full bg-muted-foreground/60"
                  />
                  {f.label}
                  {f.soon && (
                    <span className="rounded border px-1 py-px text-[11px] text-muted-foreground">
                      soon
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="col-start-2 row-start-1 text-right md:col-start-3">
              <span className="block text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                {formatINR(plan.monthlyPrice)}
              </span>
              <span className="mt-1.5 block text-[13px] text-muted-foreground">
                {plan.monthlyPrice === 0
                  ? `for ${plan.activeProjects} active project${plan.activeProjects === 1 ? "" : "s"}`
                  : "planned"}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
