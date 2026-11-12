import type { EmailContent } from "@/shared/email";

/**
 * Email reminders for things waiting on a client: a proposal or change
 * request to answer, or a payment to make. They go to the client's saved
 * email with their private link, at most once a day per item, so a client
 * is never flooded.
 */
export const REMINDER_KINDS = ["proposal", "change", "payment"] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export const REMIND_EMAIL_GAP_HOURS = 24;

/** Identifies the item a reminder was about ("change:3", "payment:<id>"). */
export function reminderKey(
  projectId: string,
  kind: ReminderKind,
  ref: string,
): string {
  return `${projectId}:${kind}:${ref}`;
}

/**
 * When the next email reminder can go, or null if one can go now: a day
 * after the last reminder, and a day after the item was sent or asked for
 * (a reminder minutes after the request would read as pushy).
 */
export function nextReminderAt(
  lastSent: Date | null,
  now: Date = new Date(),
  since: Date | null = null,
): Date | null {
  const latest = [lastSent, since]
    .filter((d): d is Date => d !== null)
    .reduce<Date | null>((a, b) => (a && a > b ? a : b), null);
  if (!latest) return null;
  const next = new Date(
    latest.getTime() + REMIND_EMAIL_GAP_HOURS * 60 * 60 * 1000,
  );
  return next > now ? next : null;
}

export type ReminderEmailInput = {
  kind: ReminderKind;
  business: string;
  /** The client's first name. */
  client: string;
  project: string;
  /** "CR-003 SEO setup", "Advance": what the reminder is about. */
  item: string;
  /** "₹8,000" (with GST where it applies). */
  amount: string;
  url: string;
  /** Payments: when it was asked for ("18 Nov"), said in the email. */
  askedOn?: string;
};

/** The reminder email, in the business's voice. */
export function reminderEmail(input: ReminderEmailInput): {
  subject: string;
  content: EmailContent;
} {
  const { business, client, project, item, amount, url } = input;
  const footnote = `Sent through ScopeLock for ${business}. Your link is private to you; there's nothing to sign up for.`;
  switch (input.kind) {
    case "proposal":
      return {
        subject: `Reminder: the proposal for ${project} is waiting for you`,
        content: {
          preview: `${business} · ${amount}`,
          heading: `The proposal for ${project} is waiting for your answer`,
          paragraphs: [
            `Hi ${client}, a reminder from ${business}: the proposal for ${project} (${amount}) is ready for you.`,
            "Open it to approve it, or to ask for changes. It takes a minute on your phone.",
          ],
          action: { label: "Open the proposal", url },
          footnote,
        },
      };
    case "change":
      return {
        subject: `Reminder: ${item} for ${project} needs your answer`,
        content: {
          preview: `${business} · ${amount}`,
          heading: `${item} is waiting for your answer`,
          paragraphs: [
            `Hi ${client}, a reminder from ${business}: ${item} (${amount}) for ${project} is waiting for you.`,
            "It's extra work beyond what you agreed, so it needs your yes before it starts. Open it to approve or decline.",
          ],
          action: { label: `Open ${item.split(" ")[0]}`, url },
          footnote,
        },
      };
    case "payment":
      return {
        subject: `Reminder: ${amount} due for ${project}`,
        content: {
          preview: `${item} · ${amount}`,
          heading: `${amount} due for ${project}`,
          paragraphs: [
            input.askedOn
              ? `Hi ${client}, a reminder from ${business}: the ${item} payment for ${project} (${amount}), asked for on ${input.askedOn}, is still due.`
              : `Hi ${client}, a reminder from ${business}: the ${item} payment for ${project} (${amount}) is due.`,
            "Open the link to see how to pay (UPI, bank transfer or a payment link). After paying, tap “I've paid” and add the UTR.",
          ],
          action: { label: "See how to pay", url },
          footnote: input.askedOn
            ? `If you've already paid, tap “I've paid” on the payment page and add the UTR, and these reminders stop. You pay ${business} directly. ScopeLock never holds your money.`
            : `You pay ${business} directly. ScopeLock never holds your money.`,
        },
      };
  }
}
