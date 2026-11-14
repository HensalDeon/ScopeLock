import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  completePlans,
  DEFAULT_PLANS,
  planById,
  type Plan,
} from "../domain/plans";
import { isBillingConfigured } from "@/shared/lib/env";
import { minor, type Minor } from "@/shared/lib/money";
import {
  entitledPlanId,
  needsResync,
  type Subscription,
} from "../domain/subscription";
import { fetchRazorpaySubscription } from "./razorpay";
import { findRazorpayPlanPrice } from "./razorpay-plans";
import { applyRazorpaySubscription } from "./razorpay-sync";
import * as repo from "./repository";
import { findSubscription } from "./subscriptions";

export const PLANS_TAG = "plans";

/**
 * The three plans, as the admin last saved them (defaults for any never
 * saved). Cached for the whole site and refreshed the moment an admin
 * saves. Only a build without a database (no secrets) gets the defaults:
 * at runtime a database error is thrown, never cached as the plans (or
 * people could be shown, and charged, a default price for hours).
 */
export async function getPlans(): Promise<Plan[]> {
  "use cache";
  cacheTag(PLANS_TAG);
  cacheLife("hours");
  try {
    return completePlans(await repo.findPlans());
  } catch (error) {
    if (process.env.NEXT_PHASE === "phase-production-build")
      return [...DEFAULT_PLANS];
    throw error;
  }
}

export type WorkspacePlan = {
  plan: Plan;
  subscription: Subscription;
  /**
   * What a Razorpay subscriber is actually charged a month: the price
   * they signed up at, which an admin's later price change doesn't touch.
   * Null when they don't pay through Razorpay.
   */
  chargedPrice: Minor | null;
};

/** The plan a workspace is on (Free when it has no record). */
export async function getWorkspacePlan(
  workspaceId: string,
): Promise<WorkspacePlan> {
  const plans = await getPlans();
  let subscription = await findSubscription(workspaceId);
  // Past its renewal with no word from Razorpay (a missed webhook): ask.
  if (needsResync(subscription, new Date()) && isBillingConfigured()) {
    try {
      const id = subscription.razorpay?.subscriptionId;
      if (id) {
        await applyRazorpaySubscription(await fetchRazorpaySubscription(id));
        subscription = await findSubscription(workspaceId);
      }
    } catch (error) {
      console.error("[billing] couldn't re-read a subscription", error);
    }
  }
  // A cancelled or failed paid plan falls back to Free when it runs out.
  const plan =
    planById(plans, entitledPlanId(subscription, new Date())) ??
    (plans[0] as Plan);
  const rzPlan =
    subscription.source === "razorpay"
      ? subscription.razorpay?.razorpayPlanId
      : null;
  const charged = rzPlan ? await findRazorpayPlanPrice(rzPlan) : null;
  return {
    plan,
    subscription,
    chargedPrice: charged === null ? null : minor(charged),
  };
}
