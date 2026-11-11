import Link from "next/link";
import { formatDate } from "@/shared/lib/dates";
import { formatINR } from "@/shared/lib/money";
import { Badge } from "@/shared/ui/badge";
import { Section } from "@/shared/ui/page";
import type { Plan } from "../domain/plans";
import {
  isRenewing,
  planChange,
  type Subscription,
} from "../domain/subscription";
import { CheckoutLock, PlanAction, type Payer } from "./plan-checkout";

const projectsWord = (n: number) => `active project${n === 1 ? "" : "s"}`;

export type Billing =
  /** Paid plans can't be bought yet (no Razorpay keys). */
  | { open: false }
  | {
      open: true;
      /** Owners and admins pay; members only see. */
      canPay: boolean;
      keyId: string;
      payer: Payer;
    };

/**
 * Settings → Plan & usage, the plans list: every plan with its price and
 * limit, and (once paid plans are open) the button to move to it.
 */
export function PlanChanging({
  plan,
  plans,
  subscription,
  billing,
}: {
  plan: Plan;
  plans: readonly Plan[];
  subscription: Subscription;
  billing: Billing;
}) {
  const given = subscription.source === "admin";
  const renewing = isRenewing(subscription);
  const end = subscription.razorpay?.currentEnd ?? null;
  const actions = billing.open && billing.canPay && !given;
  return (
    <Section
      title="Changing plan"
      description={
        billing.open
          ? "Paid monthly through Razorpay by UPI, card or net banking. You're charged exactly the price shown."
          : "Paid plans aren't open yet, so there's nothing to pay."
      }
    >
      <div className="grid gap-5">
        <CheckoutLock>
          <ul className="grid divide-y rounded-lg border bg-background">
            {plans.map((p) => {
              const kind = planChange({ plan, renewing }, p);
              return (
                <li
                  key={p.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3"
                >
                  <div className="grid gap-0.5">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {p.name}
                      {p.id === plan.id && (
                        <Badge variant="secondary">Your plan</Badge>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      <span className="font-semibold text-foreground">
                        {formatINR(p.monthlyPrice)}
                      </span>{" "}
                      a month
                      {given && p.id === plan.id ? ", not charged" : ""} ·{" "}
                      {p.activeProjects} {projectsWord(p.activeProjects)}
                      {p.teamMembers > 1
                        ? `, up to ${p.teamMembers} people`
                        : ""}
                    </span>
                  </div>
                  {actions && kind !== "current" && (
                    <PlanAction
                      kind={kind}
                      planId={p.id}
                      planName={p.name}
                      price={formatINR(p.monthlyPrice)}
                      currentPlanName={plan.name}
                      keyId={billing.keyId}
                      payer={billing.payer}
                      periodEnd={end ? formatDate(end) : null}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </CheckoutLock>
        <div className="grid max-w-prose gap-2 text-sm text-pretty text-muted-foreground">
          {given ? (
            <p>
              ScopeLock set your plan, so there&apos;s nothing to change or pay
              here.
            </p>
          ) : billing.open ? (
            <>
              <p>
                Moving up starts straight away. Moving down, or cancelling,
                applies from your next billing date; you keep what you&apos;ve
                paid for until then. Razorpay emails a receipt for every
                payment. A plan paid by UPI AutoPay can&apos;t be switched in
                place: cancel it, then start the new one when it ends.
              </p>
              <p>
                Nothing you&apos;ve made is removed: if you have more active
                projects than a smaller plan allows, they keep working, and you
                archive one before starting another.
              </p>
              {!billing.canPay && (
                <p className="text-foreground">
                  Only the workspace&apos;s owner or an admin can pay for or
                  change its plan.
                </p>
              )}
            </>
          ) : (
            <p>
              When paid plans open, you&apos;ll change plan here and pay monthly
              by UPI, card or net banking, with an invoice each time. Moving up
              starts straight away; moving down applies from your next billing
              date. Nothing you&apos;ve made is removed: if you have more active
              projects than the smaller plan allows, they keep working, and you
              archive one before starting another.
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
  );
}

/** One line under the plan's name about its Razorpay subscription. */
export function BillingStatus({
  plan,
  plans,
  subscription,
}: {
  plan: Plan;
  plans: readonly Plan[];
  subscription: Subscription;
}) {
  const rz = subscription.source === "razorpay" ? subscription.razorpay : null;
  if (!rz) return null;
  const end = rz.currentEnd ? formatDate(rz.currentEnd) : null;
  const next = rz.scheduledPlanId
    ? plans.find((p) => p.id === rz.scheduledPlanId)
    : null;
  const paidPlan = plans.find((p) => p.id === subscription.planId);
  const link = "font-medium underline underline-offset-4";
  if (rz.status === "pending")
    return (
      <p className="text-sm text-pretty text-warning-ink">
        Your last payment didn&apos;t go through. Razorpay will try again; if it
        keeps failing, your workspace moves to Free.{" "}
        {rz.shortUrl && (
          <a
            href={rz.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            Pay another way
          </a>
        )}
      </p>
    );
  // The paid plan has lapsed: say why the workspace is on Free now.
  if (plan.id === "free") {
    if (rz.status === "halted")
      return (
        <p className="text-sm text-pretty text-warning-ink">
          {paidPlan?.name ?? "Your paid plan"} ended because Razorpay
          couldn&apos;t collect the payment. Everything you made is still here;
          upgrade again below to pay another way.
        </p>
      );
    return (
      <p className="text-sm text-pretty text-muted-foreground">
        {paidPlan?.name ?? "Your paid plan"} ended
        {end ? ` on ${end}` : ""}. Everything you made is still here.
      </p>
    );
  }
  if (rz.cancelAtCycleEnd)
    return (
      <p className="text-sm text-pretty text-muted-foreground">
        Cancelled. You keep {plan.name}
        {end ? ` until ${end}` : ""}, then move to Free.
      </p>
    );
  return (
    <p className="text-sm text-pretty text-muted-foreground">
      Paid through Razorpay{end ? `, renews on ${end}` : ""}.
      {next ? ` Moves to ${next.name}${end ? ` on ${end}` : ""}.` : ""}
    </p>
  );
}
