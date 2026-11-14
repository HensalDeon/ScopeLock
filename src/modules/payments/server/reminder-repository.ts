import "server-only";
import type { ObjectId } from "mongodb";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection } from "@/shared/db/scoped";
import type { PaymentDoc } from "./repository";

/** Automatic payment reminders: what's due, and each reminder's claim. */

const payments = (workspaceId: string) =>
  scopedCollection<PaymentDoc>(COLLECTIONS.payments, workspaceId);

/** Due payments in one workspace, oldest first (the daily reminder run). */
export async function findDuePaymentDocs(
  workspaceId: string,
): Promise<PaymentDoc[]> {
  return payments(workspaceId)
    .find({ status: "due" }, { sort: { requestedAt: 1 }, limit: 200 })
    .toArray();
}

/**
 * Takes reminder number `step` (0-based) for this payment before it's
 * emailed. Atomic: false if it's no longer due, is paused, or that
 * reminder was already taken (a second run at the same time).
 */
export async function claimAutoReminder(
  workspaceId: string,
  id: ObjectId,
  step: number,
  at: Date,
): Promise<boolean> {
  const sentSoFar =
    step === 0
      ? {
          $or: [
            { "autoReminders.sent": { $exists: false } },
            { "autoReminders.sent": { $size: 0 } },
          ],
        }
      : { "autoReminders.sent": { $size: step } };
  const { modifiedCount } = await payments(workspaceId).updateOne(
    {
      _id: id,
      status: "due",
      "autoReminders.paused": { $ne: true },
      ...sentSoFar,
    },
    { $push: { "autoReminders.sent": at } },
  );
  return modifiedCount === 1;
}

/** Gives a claimed reminder back when its email couldn't be sent. */
export async function releaseAutoReminder(
  workspaceId: string,
  id: ObjectId,
  at: Date,
): Promise<void> {
  await payments(workspaceId).updateOne(
    { _id: id },
    { $pull: { "autoReminders.sent": at } },
  );
}

/**
 * Pause automatic reminders for one due payment (until a day, or with no
 * end date), or resume them (neither).
 */
export async function setAutoRemindersPaused(
  workspaceId: string,
  projectId: ObjectId,
  id: ObjectId,
  pause: { paused: boolean; until: Date | null },
): Promise<boolean> {
  const { matchedCount } = await payments(workspaceId).updateOne(
    { _id: id, projectId, status: "due" },
    pause.until
      ? {
          $set: {
            "autoReminders.paused": false,
            "autoReminders.pausedUntil": pause.until,
          },
        }
      : {
          $set: { "autoReminders.paused": pause.paused },
          $unset: { "autoReminders.pausedUntil": "" },
        },
  );
  return matchedCount === 1;
}
