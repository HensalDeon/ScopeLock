import "server-only";
import {
  notesOf,
  subscriptionFromRazorpay,
  type RazorpaySubscriptionEntity,
} from "../domain/razorpay";
import type { Plan } from "../domain/plans";
import { createRazorpayPlan, razorpayMode } from "./razorpay";
import {
  findPlanIdForRazorpay,
  findRazorpayPlanLink,
  saveRazorpayPlanLink,
} from "./razorpay-plans";
import {
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
 * belongs to. The workspace comes from our own record of the subscription,
 * or (for a brand-new one) the workspace id we put in its notes. Returns
 * the workspace, or null if the subscription isn't one of ours.
 */
export async function applyRazorpaySubscription(
  entity: RazorpaySubscriptionEntity,
  expectedWorkspaceId?: string,
): Promise<string | null> {
  const workspaceId =
    (await findWorkspaceForRazorpay(entity.id)) ??
    notesOf(entity).workspaceId ??
    null;
  if (!workspaceId) return null;
  if (expectedWorkspaceId && workspaceId !== expectedWorkspaceId) return null;
  const planId = await findPlanIdForRazorpay(entity.plan_id);
  const previous = await findSubscription(workspaceId);
  const next = subscriptionFromRazorpay(
    entity,
    () => planId,
    previous,
    new Date(),
  );
  if (!next) return null;
  // An older subscription's late event never overwrites a newer one.
  if (
    previous.source === "razorpay" &&
    previous.razorpay &&
    previous.razorpay.subscriptionId !== entity.id &&
    (previous.razorpay.status === "active" ||
      previous.razorpay.status === "authenticated" ||
      previous.razorpay.status === "pending") &&
    entity.status !== "active" &&
    entity.status !== "authenticated"
  )
    return workspaceId;
  await saveSubscription(workspaceId, next);
  return workspaceId;
}
