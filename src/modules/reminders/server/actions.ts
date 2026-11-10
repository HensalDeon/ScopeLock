"use server";

import type { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { z } from "zod";
import { listLastReminders, logActivity } from "@/modules/activity/server";
import { changeLabel } from "@/modules/changes";
import { listChanges } from "@/modules/changes/server";
import { listOwedPayments } from "@/modules/payments/server";
import {
  findProjectWithClient,
  getShareState,
} from "@/modules/projects/server";
import { workspaceAction } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import { sendEmail } from "@/shared/email";
import { formatDateTime } from "@/shared/lib/dates";
import { UserError } from "@/shared/lib/form-state";
import { formatMoney } from "@/shared/lib/money";
import {
  nextReminderAt,
  REMINDER_KINDS,
  reminderEmail,
  reminderKey,
  type ReminderKind,
} from "../domain/reminder";

const GONE =
  "This isn't waiting on the client any more. Refresh the page to see where it stands.";

/** What the reminder is about, and where the client answers or pays. */
async function target(
  kind: ReminderKind,
  ref: string,
  project: NonNullable<Awaited<ReturnType<typeof findProjectWithClient>>>,
  portal: string,
): Promise<{ item: string; amount: string; url: string; since: Date | null }> {
  const money = (n: Parameters<typeof formatMoney>[0]) =>
    formatMoney(n, project.currency);
  if (kind === "proposal") {
    if (project.status !== "awaiting_approval") throw new UserError(GONE);
    return {
      item: "the proposal",
      amount: money(project.baseline.total),
      url: portal,
      since: project.sentAt,
    };
  }
  if (kind === "change") {
    const change = (await listChanges(project.id)).find(
      (c) => String(c.number) === ref && c.status === "sent",
    );
    if (!change) throw new UserError(GONE);
    return {
      item: `${changeLabel(change.number)} ${change.title}`,
      amount: money(change.total),
      url: `${portal}/changes/${change.number}`,
      since: change.sentAt,
    };
  }
  const payment = (await listOwedPayments()).find(
    (p) => p.id === ref && p.projectId === project.id && p.status === "due",
  );
  if (!payment) throw new UserError(GONE);
  return {
    item: payment.label,
    amount: money(payment.payable),
    url: `${portal}/pay/${payment.id}`,
    since: payment.requestedAt,
  };
}

/**
 * Overview "Email reminder": emails the client their private link for
 * something waiting on them. At most once a day per item.
 */
export const emailReminder = workspaceAction(
  {
    fields: ["projectId", "kind", "ref"] as const,
    schema: z.object({
      projectId: z.string().min(1),
      kind: z.enum(REMINDER_KINDS),
      ref: z.string().min(1).max(40),
    }),
  },
  async ({ projectId, kind, ref }, { workspace, user }) => {
    const project = await findProjectWithClient(projectId);
    if (!project) throw new UserError(GONE);
    const to = project.client?.email;
    if (!to)
      throw new UserError(
        "This client has no email saved. Add one on their client page, or send the link on WhatsApp.",
      );
    const key = reminderKey(project.id, kind, ref);
    const portal = (await getShareState(project.id)).url;
    if (!portal) throw new UserError(GONE);

    const { item, amount, url, since } = await target(
      kind,
      ref,
      project,
      portal,
    );
    const client = project.client?.name.trim().split(/\s+/)[0] ?? "there";
    const last = (await listLastReminders()).get(key) ?? null;
    const wait = nextReminderAt(last, new Date(), since);
    if (wait)
      throw new UserError(
        last
          ? `You emailed a reminder about this in the last day. The next one can go from ${formatDateTime(wait)}.`
          : `This went to ${client} less than a day ago. A reminder can go from ${formatDateTime(wait)}.`,
      );
    await sendEmail({
      to,
      ...reminderEmail({
        kind,
        business: workspace.businessName,
        client,
        project: project.name,
        item,
        amount,
        url,
      }),
    });
    await logActivity(workspace.workspaceId, {
      projectId: parseObjectId(project.id) as ObjectId,
      type: "reminder.emailed",
      actor: { kind: "member", userId: user.id, name: user.name },
      data: {
        title:
          kind === "proposal"
            ? `the proposal for ${project.name}`
            : kind === "payment"
              ? `the ${item} payment`
              : item,
        label: key,
      },
    });
    refresh();
    return { message: `Reminder emailed to ${to}.` };
  },
);
