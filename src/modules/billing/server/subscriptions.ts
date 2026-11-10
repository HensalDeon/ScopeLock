import "server-only";
import type { ClientSession } from "mongodb";
import { platformCollection } from "@/shared/db/platform";
import { FREE_SUBSCRIPTION, type Subscription } from "../domain/subscription";

/**
 * Each workspace's ScopeLock plan: one record per workspace (none = Free).
 * Platform-level: read for the workspace itself, written by the admin (and
 * Razorpay later), never by the workspace.
 */
type SubscriptionDoc = Subscription & { workspaceId: string; updatedAt: Date };

const subscriptions = () =>
  platformCollection<SubscriptionDoc>("subscriptions");

const toSubscription = (d: SubscriptionDoc): Subscription => ({
  planId: d.planId,
  source: d.source,
  note: d.note,
  setBy: d.setBy,
  setAt: d.setAt,
});

export async function findSubscription(
  workspaceId: string,
): Promise<Subscription> {
  const doc = await subscriptions().findOne({ workspaceId });
  return doc ? toSubscription(doc) : FREE_SUBSCRIPTION;
}

/** For the admin's workspace list: each workspace's plan, Free if none. */
export async function findSubscriptions(
  workspaceIds: readonly string[],
): Promise<Map<string, Subscription>> {
  const docs = await subscriptions()
    .find({ workspaceId: { $in: [...workspaceIds] } })
    .toArray();
  return new Map(docs.map((d) => [d.workspaceId, toSubscription(d)]));
}

export async function saveSubscription(
  workspaceId: string,
  subscription: Subscription,
  session?: ClientSession,
): Promise<void> {
  await subscriptions().replaceOne(
    { workspaceId },
    { ...subscription, workspaceId, updatedAt: new Date() },
    { upsert: true, session },
  );
}

/** Workspaces an admin put on a paid plan (to review comps later). */
export async function findGivenWorkspaceIds(): Promise<string[]> {
  const docs = await subscriptions()
    .find({ source: "admin" }, { projection: { workspaceId: 1 } })
    .toArray();
  return docs.map((d) => d.workspaceId);
}
