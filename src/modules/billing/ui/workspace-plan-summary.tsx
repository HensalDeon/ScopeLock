import { formatDate, formatDateTime } from "@/shared/lib/dates";
import type { Plan } from "../domain/plans";
import { isRenewing, type Subscription } from "../domain/subscription";

/**
 * Admin, one workspace: how it got its plan, in words, and whether a plan
 * can be set by hand. A plan set here never charges or changes a Razorpay
 * subscription, so one that's still renewing must be changed by the
 * customer (or cancelled in Razorpay) first.
 */
export function workspacePlanState(
  subscription: Subscription,
  plan: Plan,
  plans: readonly Plan[],
): { summary: string; canSet: boolean; warning: string | null } {
  const rz = subscription.source === "razorpay" ? subscription.razorpay : null;
  const paid = plans.find((p) => p.id === subscription.planId);
  if (rz) {
    const end = rz.currentEnd
      ? formatDate(rz.currentEnd, { withYear: true })
      : null;
    if (isRenewing(subscription))
      return {
        summary: `Pays for ${paid?.name ?? plan.name} through Razorpay${end ? `, renewing on ${end}` : ""} (subscription ${rz.subscriptionId}).`,
        canSet: false,
        warning:
          "A plan can't be set by hand while this renews: Razorpay would keep charging for a plan they no longer have. They switch or cancel from Settings → Plan & usage, or you cancel the subscription in the Razorpay dashboard first. If it's already cancelled there, this updates when its paid period ends.",
      };
    if (plan.id !== "free")
      return {
        summary: `Paid for ${plan.name} through Razorpay and cancelled: keeps it${end ? ` until ${end}` : ""}, then Free (subscription ${rz.subscriptionId}).`,
        canSet: true,
        warning:
          "A plan set here replaces it straight away, free of charge. Razorpay isn't charged or changed.",
      };
    return {
      summary: `Paid for ${paid?.name ?? "a plan"} through Razorpay until ${end ?? "its period ended"}; on Free since (subscription ${rz.subscriptionId}).`,
      canSet: true,
      warning: null,
    };
  }
  if (
    // Set by an admin (Free included: taken back to Free by hand).
    subscription.setAt &&
    subscription.setBy
  )
    return {
      summary: `On ${plan.name}, set ${formatDateTime(subscription.setAt)} by ${subscription.setBy}${subscription.note ? `. Reason: ${subscription.note}` : ""}.`,
      canSet: true,
      warning: null,
    };
  return {
    summary: `On ${plan.name}, as every new workspace starts.`,
    canSet: true,
    warning: null,
  };
}
