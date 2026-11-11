import Link from "next/link";
import { formatINR } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Section } from "@/shared/ui/page";
import { statesLimit } from "../domain/plan-lines";
import type { Plan } from "../domain/plans";
import type { Subscription, Usage } from "../domain/subscription";

const projectsWord = (n: number) => `active project${n === 1 ? "" : "s"}`;

const Soon = () => (
  <span className="rounded border px-1 py-px text-[11px] text-muted-foreground">
    soon
  </span>
);

/**
 * Settings → Plan & usage: the workspace's plan, how much of it is used,
 * and how changing plan will work. Paid plans aren't open yet, so there's
 * no upgrade button; a full plan points to archiving a finished project.
 */
export function PlanUsage({
  plan,
  plans,
  subscription,
  projects,
}: {
  plan: Plan;
  plans: readonly Plan[];
  subscription: Subscription;
  projects: Usage;
}) {
  const given = subscription.source === "admin";
  const price = (p: Plan) => (
    <>
      <span className="font-semibold tabular-nums">
        {formatINR(p.monthlyPrice)}
      </span>
      <span className="text-muted-foreground">
        {" "}
        a month{given && p.id === plan.id ? ", not charged" : ""}
      </span>
    </>
  );
  return (
    <div>
      <Section
        title="Your plan"
        description="What your workspace can do, and how much of it you're using."
      >
        <div className="grid gap-5">
          <div className="grid gap-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className="text-2xl font-semibold tracking-[-0.02em]">
                {plan.name}
              </p>
              <p className="text-sm">{price(plan)}</p>
            </div>
            {given && (
              <p className="text-sm text-pretty text-muted-foreground">
                ScopeLock put your workspace on {plan.name}, free of charge.
              </p>
            )}
          </div>

          <dl className="grid divide-y rounded-lg border bg-background">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 px-4 py-3">
              <dt className="text-sm">Active projects</dt>
              <dd
                className={cn(
                  "text-right text-[15px] font-semibold tabular-nums",
                  projects.full && "text-warning-ink",
                )}
              >
                {projects.used} of {projects.limit}
              </dd>
              <dd
                className={cn(
                  "col-span-full text-[13px] text-pretty",
                  projects.full ? "text-warning-ink" : "text-muted-foreground",
                )}
              >
                {projects.over
                  ? `More than ${plan.name} allows. They all keep working; archive ${projects.used - projects.limit + 1} to start a new one.`
                  : projects.full
                    ? "Your plan is full. Archive a finished project to start a new one."
                    : "Every project that isn't archived counts."}{" "}
                {projects.full && (
                  <Link
                    href="/projects"
                    className="font-medium text-foreground underline underline-offset-4 max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
                  >
                    Go to projects
                  </Link>
                )}
              </dd>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 px-4 py-3">
              <dt className="text-sm">Team members</dt>
              <dd className="flex items-center gap-2 text-right text-sm tabular-nums">
                {plan.teamMembers === 1 ? (
                  "Just you"
                ) : (
                  <>
                    Up to {plan.teamMembers} <Soon />
                  </>
                )}
              </dd>
            </div>
          </dl>

          <ul className="grid gap-1.5 text-sm">
            {plan.highlights
              .filter((h) => !statesLimit(h.label))
              .map((h) => (
                <li key={h.label} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-1 shrink-0 rounded-full bg-muted-foreground/60"
                  />
                  {h.label}
                  {h.soon && <Soon />}
                </li>
              ))}
          </ul>
        </div>
      </Section>

      <Section
        title="Changing plan"
        description="Prices before GST. Paid plans aren't open yet, so there's nothing to pay."
      >
        <div className="grid gap-5">
          <ul className="grid divide-y rounded-lg border bg-background">
            {plans.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 px-4 py-3"
              >
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {p.name}
                  {p.id === plan.id && (
                    <Badge variant="secondary">Your plan</Badge>
                  )}
                </span>
                <span className="text-right text-sm">{price(p)}</span>
                <span className="col-span-full text-sm text-muted-foreground tabular-nums">
                  {p.activeProjects} {projectsWord(p.activeProjects)}
                  {p.teamMembers > 1 ? `, up to ${p.teamMembers} people` : ""}
                </span>
              </li>
            ))}
          </ul>
          <div className="grid max-w-prose gap-2 text-sm text-pretty text-muted-foreground">
            {given ? (
              <p>
                ScopeLock set your plan, so there&apos;s nothing to change or
                pay here.
              </p>
            ) : (
              <p>
                When paid plans open, you&apos;ll change plan here and pay
                monthly by UPI, card or net banking, with a GST invoice each
                time. Moving up starts straight away; moving down applies from
                your next billing date. Nothing you&apos;ve made is removed: if
                you have more active projects than the smaller plan allows, they
                keep working, and you archive one before starting another.
              </p>
            )}
            <p>
              Questions about plans?{" "}
              <Link
                href="/contact"
                className="font-medium text-foreground underline underline-offset-4 max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
              >
                Contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
