import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { completePlans, DEFAULT_PLANS, type Plan } from "../domain/plans";
import * as repo from "./repository";

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
