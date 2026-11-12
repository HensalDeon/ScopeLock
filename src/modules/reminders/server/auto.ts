import "server-only";
import { ObjectId } from "mongodb";
import { lastRemindersIn, logActivity } from "@/modules/activity/server";
import { getWorkspacePlan } from "@/modules/billing/server";
import {
  AUTO_REMINDER_DAYS,
  isAutoReminderDue,
  isSendingHour,
  type Payment,
} from "@/modules/payments";
import {
  autoRemindersOnIn,
  claimAutoReminder,
  listDuePaymentsIn,
  releaseAutoReminder,
  workspacesWithDuePayments,
} from "@/modules/payments/server";
import { findReminderTarget } from "@/modules/projects/server";
import { getWorkspaceProfile } from "@/modules/workspace/server";
import { sendEmail } from "@/shared/email";
import { formatDate } from "@/shared/lib/dates";
import { formatMoney } from "@/shared/lib/money";
import { reminderEmail, reminderKey } from "../domain/reminder";

const DAY_MS = 24 * 60 * 60 * 1000;
/** A run stops after this many emails; the rest go on the next run. */
const MAX_EMAILS_PER_RUN = 300;

export type AutoReminderRun = {
  /** Outside 9 am to 8 pm India time: nothing was looked at. */
  outsideHours: boolean;
  workspaces: number;
  sent: number;
  failed: number;
};

/**
 * The daily run of automatic payment reminders (Pro and Agency). Safe to
 * run more than once a day, or twice at the same time: each reminder is
 * claimed on its payment before it's emailed, so none goes twice.
 */
export async function runAutoReminders(
  now: Date = new Date(),
): Promise<AutoReminderRun> {
  const run: AutoReminderRun = {
    outsideHours: !isSendingHour(now),
    workspaces: 0,
    sent: 0,
    failed: 0,
  };
  if (run.outsideHours) return run;
  // Nothing is due earlier than the first reminder (a day of slack for
  // the Indian calendar).
  const askedBefore = new Date(
    now.getTime() - (AUTO_REMINDER_DAYS[0] - 1) * DAY_MS,
  );
  for (const workspaceId of await workspacesWithDuePayments(askedBefore)) {
    if (run.sent >= MAX_EMAILS_PER_RUN) break;
    try {
      await remindWorkspace(workspaceId, now, run);
    } catch (error) {
      console.error("[reminders] workspace skipped", workspaceId, error);
      run.failed += 1;
    }
  }
  return run;
}

async function remindWorkspace(
  workspaceId: string,
  now: Date,
  run: AutoReminderRun,
): Promise<void> {
  const { plan } = await getWorkspacePlan(workspaceId);
  if (!plan.features.automaticReminders) return;
  if (!(await autoRemindersOnIn(workspaceId))) return;
  const [profile, payments, manual] = await Promise.all([
    getWorkspaceProfile(workspaceId),
    listDuePaymentsIn(workspaceId),
    lastRemindersIn(workspaceId, new Date(now.getTime() - 3 * DAY_MS)),
  ]);
  if (!profile) return;
  run.workspaces += 1;
  for (const payment of payments) {
    if (run.sent >= MAX_EMAILS_PER_RUN) return;
    const key = reminderKey(payment.projectId, "payment", payment.id);
    const state = {
      requestedAt: payment.requestedAt,
      dueSince: payment.dueSince,
      sent: payment.autoReminders.sent,
      paused: payment.autoReminders.paused,
    };
    if (!isAutoReminderDue(state, manual.get(key) ?? null, now)) continue;
    const sent = await remind(workspaceId, profile.businessName, payment, now);
    if (sent === "sent") run.sent += 1;
    if (sent === "failed") run.failed += 1;
  }
}

/** Claims, emails and logs one reminder. */
async function remind(
  workspaceId: string,
  business: string,
  payment: Payment,
  now: Date,
): Promise<"sent" | "skipped" | "failed"> {
  const project = await findReminderTarget(workspaceId, payment.projectId);
  const to = project?.client?.email;
  if (!project || project.archived || !to || !project.portalUrl)
    return "skipped";
  if (!(await claimAutoReminder(workspaceId, payment, now))) return "skipped";
  try {
    await sendEmail({
      to,
      ...reminderEmail({
        kind: "payment",
        business,
        client: project.client?.name.trim().split(/\s+/)[0] ?? "there",
        project: project.name,
        item: payment.label,
        amount: formatMoney(payment.payable, payment.currency),
        url: `${project.portalUrl}/pay/${payment.id}`,
        askedOn: formatDate(payment.requestedAt, { now }),
      }),
    });
  } catch (error) {
    console.error("[reminders] email not sent", payment.id, error);
    await releaseAutoReminder(workspaceId, payment.id, now);
    return "failed";
  }
  await logActivity(workspaceId, {
    projectId: new ObjectId(payment.projectId),
    type: "reminder.auto_emailed",
    at: now,
    actor: { kind: "system" },
    data: {
      title: `the ${payment.label} payment`,
      label: reminderKey(payment.projectId, "payment", payment.id),
    },
  });
  return "sent";
}
