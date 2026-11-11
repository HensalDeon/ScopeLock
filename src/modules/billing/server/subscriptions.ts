import "server-only";
import type { ClientSession } from "mongodb";
import { platformCollection } from "@/shared/db/platform";
import { FREE_SUBSCRIPTION, type Subscription } from "../domain/subscription";

/**
 * Each workspace's ScopeLock plan: one record per workspace (none = Free).
 * Platform-level: read for the workspace itself, written by the admin and
 * by Razorpay's confirmed events, never by the workspace directly.
 */
type SubscriptionDoc = Subscription & {
  workspaceId: string;
  updatedAt: Date;
  /** The last Checkout started, until its payment is confirmed. */
  checkout?: { subscriptionId: string; planId: string; startedAt: Date };
};

const subscriptions = () =>
  platformCollection<SubscriptionDoc>("subscriptions");

const toSubscription = (d: SubscriptionDoc): Subscription => ({
  planId: d.planId,
  source: d.source,
  note: d.note,
  setBy: d.setBy,
  setAt: d.setAt,
  razorpay: d.razorpay ?? null,
});

/** Remembers a Checkout as it opens, so a paid one is never paid twice. */
export async function saveCheckoutAttempt(
  workspaceId: string,
  checkout: { subscriptionId: string; planId: string },
): Promise<void> {
  await subscriptions().updateOne(
    { workspaceId },
    { $set: { checkout: { ...checkout, startedAt: new Date() } } },
    { upsert: true },
  );
}

/** The Checkout last started for this workspace, if its result isn't in. */
export async function findCheckoutAttempt(
  workspaceId: string,
): Promise<{ subscriptionId: string; planId: string } | null> {
  const doc = await subscriptions().findOne(
    { workspaceId },
    { projection: { checkout: 1, razorpay: 1 } },
  );
  const c = doc?.checkout;
  if (!c || doc?.razorpay?.subscriptionId === c.subscriptionId) return null;
  return c;
}

/** The workspace a Razorpay subscription belongs to, if we know it. */
export async function findWorkspaceForRazorpay(
  subscriptionId: string,
): Promise<string | null> {
  const doc = await subscriptions().findOne(
    { "razorpay.subscriptionId": subscriptionId },
    { projection: { workspaceId: 1 } },
  );
  return doc?.workspaceId ?? null;
}

export async function findSubscription(
  workspaceId: string,
): Promise<Subscription> {
  const doc = await subscriptions().findOne({ workspaceId });
  // A record holding only a started checkout is still Free.
  return doc?.planId ? toSubscription(doc) : FREE_SUBSCRIPTION;
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

/** The event id is the document's _id: unique without any extra index. */
type EventDoc = { _id: string; type: string; receivedAt: Date };

/**
 * Records a Razorpay webhook event; false if it was already handled (they
 * retry, and may send the same event twice).
 */
export async function recordBillingEvent(
  eventId: string,
  type: string,
): Promise<boolean> {
  try {
    await platformCollection<EventDoc>("billingEvents").insertOne({
      _id: eventId,
      type,
      receivedAt: new Date(),
    });
    return true;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return false;
    throw error;
  }
}

/** Lets a failed event be retried (Razorpay resends it). */
export async function forgetBillingEvent(eventId: string): Promise<void> {
  await platformCollection<EventDoc>("billingEvents").deleteOne({
    _id: eventId,
  });
}
