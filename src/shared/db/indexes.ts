import type { Db, IndexDescription } from "mongodb";
import { COLLECTIONS, type CollectionName } from "./names";

/**
 * Index definitions for every collection. Applied by `npm run db:indexes`
 * (idempotent — safe to run on every deploy).
 */
export const INDEXES: Partial<Record<CollectionName, IndexDescription[]>> = {
  [COLLECTIONS.authUser]: [{ key: { email: 1 }, unique: true }],
  [COLLECTIONS.authSession]: [
    { key: { token: 1 }, unique: true },
    { key: { userId: 1 } },
    // MongoDB removes expired sessions on its own.
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ],
  [COLLECTIONS.authAccount]: [
    { key: { userId: 1 } },
    { key: { providerId: 1, accountId: 1 } },
  ],
  [COLLECTIONS.authVerification]: [
    { key: { identifier: 1 } },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ],
  [COLLECTIONS.authOrganization]: [{ key: { slug: 1 }, unique: true }],
  [COLLECTIONS.authMember]: [
    { key: { organizationId: 1, userId: 1 }, unique: true },
    { key: { userId: 1 } },
  ],
  [COLLECTIONS.authInvitation]: [
    { key: { organizationId: 1 } },
    { key: { email: 1 } },
  ],
  [COLLECTIONS.authRateLimit]: [{ key: { key: 1 }, unique: true }],

  [COLLECTIONS.workspaceProfiles]: [{ key: { workspaceId: 1 }, unique: true }],

  // Business data: every index starts with workspaceId (see CONVENTIONS §2).
  [COLLECTIONS.clients]: [
    { key: { workspaceId: 1, archivedAt: 1, nameLower: 1 } },
  ],
  [COLLECTIONS.documentSettings]: [{ key: { workspaceId: 1 }, unique: true }],
  // Rate-limit counters expire on their own.
  [COLLECTIONS.requestLimits]: [
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ],
  [COLLECTIONS.changeRequests]: [
    // CR-001, CR-002… are unique within a project.
    { key: { workspaceId: 1, projectId: 1, number: 1 }, unique: true },
    // The overview: open changes, and approved ones for "revenue recovered".
    { key: { workspaceId: 1, status: 1, updatedAt: -1 } },
  ],
  [COLLECTIONS.activity]: [
    { key: { workspaceId: 1, projectId: 1, at: -1 } },
    // The overview: when each item was last reminded by email.
    { key: { workspaceId: 1, type: 1, at: -1 } },
  ],
  [COLLECTIONS.paymentSettings]: [{ key: { workspaceId: 1 }, unique: true }],
  [COLLECTIONS.payments]: [
    { key: { workspaceId: 1, projectId: 1, requestedAt: -1 } },
    // One open request per slot (milestone or separate change): a double
    // tap can't ask for the same payment twice. `open` is removed on cancel.
    {
      key: { workspaceId: 1, projectId: 1, key: 1 },
      unique: true,
      partialFilterExpression: { open: true },
      name: "one_open_payment_per_slot",
    },
    // The overview: payments still owed across the workspace.
    { key: { workspaceId: 1, status: 1, requestedAt: 1 } },
  ],
  [COLLECTIONS.invoicingSettings]: [{ key: { workspaceId: 1 }, unique: true }],
  // Per-workspace sequences ("proposal": P-001, P-002…).
  [COLLECTIONS.counters]: [{ key: { workspaceId: 1, name: 1 }, unique: true }],
  [COLLECTIONS.invoices]: [
    // Rule 46(b): a number is used once (it carries the financial year).
    { key: { workspaceId: 1, number: 1 }, unique: true },
    // One invoice per payment request.
    { key: { workspaceId: 1, paymentId: 1 }, unique: true },
    { key: { workspaceId: 1, projectId: 1, issuedAt: -1 } },
  ],
  [COLLECTIONS.approvals]: [
    { key: { workspaceId: 1, projectId: 1, decidedAt: -1 } },
    // A subject (a sent proposal) can be approved only once, even on a
    // double tap or two tabs racing.
    {
      key: { workspaceId: 1, "subject.type": 1, "subject.id": 1 },
      unique: true,
      partialFilterExpression: { decision: "approved" },
      name: "one_approval_per_subject",
    },
  ],
  [COLLECTIONS.projects]: [
    // Client portal: find a project by its link's hash (public lookup).
    {
      key: { "portal.tokenHash": 1 },
      unique: true,
      partialFilterExpression: { "portal.tokenHash": { $type: "string" } },
      name: "portal_token_hash",
    },
    { key: { workspaceId: 1, updatedAt: -1 } },
    { key: { workspaceId: 1, clientId: 1, updatedAt: -1 } },
  ],
  // Platform level: a plan's price history, newest first; the admin log.
  [COLLECTIONS.planPrices]: [{ key: { planId: 1, createdAt: -1 } }],
  // Webhooks map Razorpay's plan id back to ours.
  [COLLECTIONS.razorpayPlans]: [{ key: { razorpayPlanId: 1 } }],
  [COLLECTIONS.adminAudit]: [
    { key: { at: -1 } },
    { key: { action: 1, at: -1 } },
    { key: { href: 1, at: -1 } },
  ],
  // One ScopeLock plan per workspace.
  [COLLECTIONS.subscriptions]: [
    { key: { workspaceId: 1 }, unique: true },
    // Webhooks find the workspace by Razorpay's subscription id.
    {
      key: { "razorpay.subscriptionId": 1 },
      partialFilterExpression: {
        "razorpay.subscriptionId": { $type: "string" },
      },
    },
  ],
};

export async function ensureIndexes(
  database: Db,
): Promise<{ collection: string; created: string[] }[]> {
  const results = [];
  for (const [name, specs] of Object.entries(INDEXES)) {
    if (!specs?.length) continue;
    const created = await database.collection(name).createIndexes(specs);
    results.push({ collection: name, created });
  }
  return results;
}
