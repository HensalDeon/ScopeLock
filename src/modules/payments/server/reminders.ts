import "server-only";
import { parseObjectId } from "@/shared/db/ids";
import { AUTO_REMINDER_DAYS } from "../domain/auto-reminders";
import type { Payment } from "../domain/payment";
import * as reminderRepo from "./reminder-repository";
import { toPayment } from "./repository";
import { findAutoRemindersOn } from "./settings-repository";

/**
 * For the daily reminder run, which has no signed-in member: the workspace
 * is given (it came from workspacesWithDuePayments).
 */

/** Payments due in one workspace, oldest first. */
export async function listDuePaymentsIn(
  workspaceId: string,
): Promise<Payment[]> {
  return (await reminderRepo.findDuePaymentDocs(workspaceId)).map(toPayment);
}

/** Settings → Payments: automatic reminders on (the default). */
export const autoRemindersOnIn = findAutoRemindersOn;

/** Takes the next reminder before emailing it; false if already taken. */
export async function claimAutoReminder(
  workspaceId: string,
  payment: Pick<Payment, "id" | "autoReminders">,
  at: Date,
): Promise<boolean> {
  const id = parseObjectId(payment.id);
  const step = payment.autoReminders.sent.length;
  return id && step < AUTO_REMINDER_DAYS.length
    ? reminderRepo.claimAutoReminder(workspaceId, id, step, at)
    : false;
}

/** Gives the reminder back when its email couldn't be sent. */
export async function releaseAutoReminder(
  workspaceId: string,
  paymentId: string,
  at: Date,
): Promise<void> {
  const id = parseObjectId(paymentId);
  if (id) await reminderRepo.releaseAutoReminder(workspaceId, id, at);
}

export { workspacesWithDuePayments } from "./reminder-scan";
