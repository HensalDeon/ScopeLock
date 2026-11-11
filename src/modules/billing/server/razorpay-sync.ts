import "server-only";
import {
  notesOf,
  subscriptionFromRazorpay,
  type RazorpaySubscriptionEntity,
} from "../domain/razorpay";
import type { Plan } from "../domain/plans";
import { createRazorpayPlan } from "./razorpay";
import * as repo from "./repository";
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
  const latest = await repo.findLatestPrice(plan.id);
  if (latest?.monthlyPrice === plan.monthlyPrice && latest.razorpayPlanId)
    return latest.razorpayPlanId;
  const id = await createRazorpayPlan({
    name: `ScopeLock ${plan.name}`,
    amount: plan.monthlyPrice,
    description: plan.summary,
  });
  if (latest?.monthlyPrice === plan.monthlyPrice) {
    // Two people starting at once: keep whichever link landed first.
    if (!(await repo.linkRazorpayPlan(latest.id, id))) {
      const again = await repo.findLatestPrice(plan.id);
      return again?.razorpayPlanId ?? id;
    }
  } else {
    await repo.addLinkedPrice(plan.id, plan.monthlyPrice, id);
  }
  return id;
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
  const planId = await repo.findPlanIdForRazorpay(entity.plan_id);
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
