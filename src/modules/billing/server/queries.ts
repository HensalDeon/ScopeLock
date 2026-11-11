import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  completePlans,
  DEFAULT_PLANS,
  planById,
  type Plan,
} from "../domain/plans";
import { entitledPlanId, type Subscription } from "../domain/subscription";
import * as repo from "./repository";
import { findSubscription } from "./subscriptions";

export const PLANS_TAG = "plans";

/**
 * The three plans, as the admin last saved them (defaults for any never
 * saved). Cached for the whole site and refreshed the moment an admin
 * saves. A build without a database (no secrets) gets the defaults.
 */
export async function getPlans(): Promise<Plan[]> {
  "use cache";
  cacheTag(PLANS_TAG);
  cacheLife("hours");
  try {
    return completePlans(await repo.findPlans());
  } catch {
    return [...DEFAULT_PLANS];
  }
}

export type WorkspacePlan = { plan: Plan; subscription: Subscription };

/** The plan a workspace is on (Free when it has no record). */
export async function getWorkspacePlan(
  workspaceId: string,
): Promise<WorkspacePlan> {
  const [plans, subscription] = await Promise.all([
    getPlans(),
    findSubscription(workspaceId),
  ]);
  // A cancelled or failed paid plan falls back to Free when it runs out.
  const plan =
    planById(plans, entitledPlanId(subscription, new Date())) ??
    (plans[0] as Plan);
  return { plan, subscription };
}
