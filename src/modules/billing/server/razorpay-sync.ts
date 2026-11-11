import "server-only";
import {
  notesOf,
  subscriptionFromRazorpay,
  type RazorpaySubscriptionEntity,
} from "../domain/razorpay";
import type { Plan } from "../domain/plans";
import { isRenewing } from "../domain/subscription";
import {
  cancelRazorpaySubscription,
  createRazorpayPlan,
  razorpayMode,
} from "./razorpay";
import {
  findPlanIdForRazorpay,
  findRazorpayPlanLink,
  saveRazorpayPlanLink,
} from "./razorpay-plans";
import {
  findCheckoutSubscriptionId,
  findSubscription,
  findWorkspaceForRazorpay,
  saveSubscription,
} from "./subscriptions";

/**
 * The Razorpay plan a price is sold as, created the first time it's
 * needed. A new price gets a new Razorpay plan; people already paying keep
 * the plan (and price) they signed up on.
 */
export async function razorpayPlanFor(plan: Plan): Promise<string> {
  const mode = razorpayMode();
  const linked = await findRazorpayPlanLink(mode, plan.id, plan.monthlyPrice);
  if (linked) return linked;
  const id = await createRazorpayPlan({
    name: `ScopeLock ${plan.name}`,
    amount: plan.monthlyPrice,
    description: plan.summary,
  });
  // Two people starting at once: whichever link landed first wins.
  return saveRazorpayPlanLink(mode, plan.id, plan.monthlyPrice, id);
}

/**
 * Saves what Razorpay says about a subscription onto the workspace it
 * belongs to: from our own record of the subscription, or (a new one) the
 * workspace id we put in its notes. Pass the subscription as Razorpay has
 * it now (webhooks read it again first), so a late event can't undo a
 * newer state. Returns the workspace, or null if it isn't one of ours.
 *
 * Only one subscription per workspace may charge:
 * - another subscription's later events never overwrite the current one;
 * - a new one becomes current only once paid; if the current one still
 *   renews, the one started last from Plan & usage wins and the other
 *   stops renewing (a stray, e.g. an old one paid from Razorpay's retry
 *   email, is cancelled at once and logged for a refund).
 */
export async function applyRazorpaySubscription(
  entity: RazorpaySubscriptionEntity,
): Promise<string | null> {
  const workspaceId =
    (await findWorkspaceForRazorpay(entity.id)) ??
    notesOf(entity).workspaceId ??
    null;
  if (!workspaceId) return null;
  const planId = await findPlanIdForRazorpay(entity.plan_id);
  const previous = await findSubscription(workspaceId);
  const next = subscriptionFromRazorpay(
    entity,
    () => planId,
    previous,
    new Date(),
  );
  if (!next) return null;

  const ours = previous.razorpay?.subscriptionId === entity.id;
  if (!ours) {
    const paid =
      entity.status === "active" || entity.status === "authenticated";
    // A late event from an old subscription, or one never paid: ignore it.
    if (!paid) return workspaceId;
    const chosen =
      (await findCheckoutSubscriptionId(workspaceId)) === entity.id;
    const current = previous.razorpay;
    if (isRenewing(previous) && current) {
      if (!chosen) {
        console.error(
          `[razorpay] second live subscription ${entity.id} for workspace ${workspaceId}: cancelled; refund it in the Razorpay dashboard`,
        );
        await cancelRazorpaySubscription(entity.id, "now");
        return workspaceId;
      }
      console.error(
        `[razorpay] workspace ${workspaceId} paid a new subscription ${entity.id} while ${current.subscriptionId} renewed: the old one stops at its period end`,
      );
      await cancelRazorpaySubscription(current.subscriptionId, "cycle_end");
    }
  }
  await saveSubscription(workspaceId, next);
  return workspaceId;
}
