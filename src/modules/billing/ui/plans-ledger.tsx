import type { Route } from "next";
import Link from "next/link";
import { formatINR } from "@/shared/lib/money";
import { buttonVariants } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { FEATURE_LABELS, PLAN_FEATURES, type Plan } from "../domain/plans";

const count = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/**
 * Admin: the three plans as ledger rows (price in the figure column), each
 * with what it allows and unlocks, and a way into editing it.
 */
export function PlansLedger({ plans }: { plans: readonly Plan[] }) {
  return (
    <ul aria-label="Plans" className="divide-y rounded-xl border bg-background">
      {plans.map((plan) => {
        const unlocks = PLAN_FEATURES.filter((f) => plan.features[f]).map(
          (f) => FEATURE_LABELS[f].title,
        );
        return (
          <li
            key={plan.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-3 px-5 py-4 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto_auto] md:items-center"
          >
            <div className="grid gap-0.5">
              <h2 className="text-[15px] font-semibold">{plan.name}</h2>
              <p className="text-sm text-pretty text-muted-foreground">
                {plan.summary}
              </p>
            </div>
            <dl className="col-span-full row-start-2 grid gap-1 text-sm md:col-span-1 md:col-start-2 md:row-start-1">
              <div className="flex flex-wrap gap-x-1.5">
                <dt className="sr-only">Limits</dt>
                <dd className="tabular-nums">
                  {count(
                    plan.activeProjects,
                    "active project",
                    "active projects",
                  )}
                  {" · "}
                  {count(plan.teamMembers, "team member", "team members")}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Unlocks</dt>
                <dd className="text-pretty text-muted-foreground">
                  {unlocks.length ? unlocks.join(", ") : "Nothing extra"}
                </dd>
              </div>
            </dl>
            <p className="col-start-2 row-start-1 text-right md:col-start-3">
              <span className="block text-xl font-semibold tracking-[-0.02em] tabular-nums">
                {formatINR(plan.monthlyPrice)}
              </span>
              <span className="text-[12px] text-muted-foreground">a month</span>
            </p>
            <Link
              href={`/admin/plans/${plan.id}` as Route}
              aria-label={`Edit ${plan.name}`}
              className={buttonVariants({
                variant: "secondary",
                size: "sm",
                className: `col-span-full w-fit md:col-span-1 ${TOUCH}`,
              })}
            >
              Edit
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
