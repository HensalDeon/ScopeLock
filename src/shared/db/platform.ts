import "server-only";
import type { Collection, Document } from "mongodb";
import { db } from "./client";
import { COLLECTIONS } from "./names";

/**
 * The few collections that belong to the platform, not to a workspace:
 * subscription plans, their price history and the admin audit log. Module
 * code reaches them only through this (never the raw collection() helper),
 * so nothing can open a workspace collection without its workspace filter.
 */
export const PLATFORM_COLLECTIONS = {
  plans: COLLECTIONS.plans,
  planPrices: COLLECTIONS.planPrices,
  adminAudit: COLLECTIONS.adminAudit,
} as const;

export type PlatformCollection = keyof typeof PLATFORM_COLLECTIONS;

export function platformCollection<T extends Document>(
  name: PlatformCollection,
): Collection<T> {
  return db().collection<T>(PLATFORM_COLLECTIONS[name]);
}
