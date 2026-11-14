"use client";

import type { PlanChange } from "../domain/subscription";
import { CheckoutButton } from "./checkout-button";
import type { Payer } from "./checkout-lock";
import { ConfirmChange } from "./plan-change-confirm";

export { CheckoutLock, type Payer } from "./checkout-lock";

/**
 * The action for one plan row in Settings → Plan & usage, with what it
 * charges and when said before anyone presses it.
 */
export function PlanAction({
  kind,
  planId,
  planName,
  price,
  currentPlanName,
  keyId,
  payer,
  periodEnd,
}: {
  kind: PlanChange;
  planId: string;
  planName: string;
  /** Formatted monthly price ("₹499"). */
  price: string;
  currentPlanName: string;
  keyId: string;
  payer: Payer;
  /** When the current paid period ends ("12 Dec"), if known. */
  periodEnd: string | null;
}) {
  const until = periodEnd ? `on ${periodEnd}` : "at your next billing date";
  const description = `${planName} plan, ${price} a month`;
  switch (kind) {
    case "subscribe":
      return (
        <CheckoutButton
          planId={planId}
          label={`Upgrade to ${planName}`}
          description={description}
          keyId={keyId}
          payer={payer}
          hint={`${price} when you pay, then every month on that date until you cancel.`}
        />
      );
    case "restart":
      return (
        <CheckoutButton
          planId={planId}
          label={`Start ${planName} now`}
          description={description}
          keyId={keyId}
          payer={payer}
          hint={`${price} when you pay, then monthly. The ${currentPlanName} days you have left aren't refunded.`}
        />
      );
    case "upgrade":
      return (
        <ConfirmChange
          kind="upgrade"
          planId={planId}
          label={`Switch to ${planName}`}
          pendingLabel="Switching…"
          explain={`${planName} starts now. Razorpay charges the difference for the rest of this billing month today, then ${price} a month.`}
        />
      );
    case "downgrade":
      return (
        <ConfirmChange
          kind="downgrade"
          planId={planId}
          label={`Switch to ${planName}`}
          pendingLabel="Switching…"
          explain={`You keep ${currentPlanName} until your next billing date${periodEnd ? `, ${periodEnd}` : ""}, then move to ${planName} at ${price} a month. Nothing is charged today.`}
        />
      );
    case "cancel":
      return (
        <ConfirmChange
          kind="cancel"
          planId={planId}
          label={`Cancel ${currentPlanName}`}
          pendingLabel="Cancelling…"
          explain={`Your plan stops renewing, and you won't be charged again. You keep ${currentPlanName} until it ends ${until}, then move to Free. Nothing is deleted.`}
        />
      );
    default:
      return null;
  }
}
