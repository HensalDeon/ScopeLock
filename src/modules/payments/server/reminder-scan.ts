import "server-only";
// eslint-disable-next-line no-restricted-imports -- only for workspacesWithDuePayments (reviewed: the daily reminder run)
import { collection } from "@/shared/db/collections";
import { COLLECTIONS } from "@/shared/db/names";
import type { PaymentDoc } from "./repository";

/**
 * The daily reminder run's one cross-workspace read: which workspaces have
 * a payment due that was asked for before `askedBefore`. Ids only; each
 * workspace's payments are then read through its own scoped collection.
 */
export async function workspacesWithDuePayments(
  askedBefore: Date,
): Promise<string[]> {
  const ids = await collection<PaymentDoc>(COLLECTIONS.payments).distinct(
    "workspaceId",
    {
      status: "due",
      requestedAt: { $lte: askedBefore },
      "autoReminders.paused": { $ne: true },
    },
  );
  return ids.map(String);
}
