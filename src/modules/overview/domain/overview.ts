import type { CurrencyCode } from "@/shared/lib/currency";
import { formatAgo } from "@/shared/lib/dates";
import { isReminder } from "@/shared/lib/reminder";
import { formatMoney, type Minor } from "@/shared/lib/money";
import { whatsappLink } from "@/shared/lib/phone";

/**
 * The overview's rules, as pure functions over plain data: what's waiting on
 * clients, what needs the freelancer, and the first-run checklist. The
 * server query loads the data; the UI only renders what these return.
 */

type Status =
  "draft" | "awaiting_approval" | "active" | "completed" | "archived";

/** What the money strip needs from a project. */
export type ProjectFigures = {
  status: Status;
  currency: CurrencyCode;
  baselineTotal: Minor;
  totals: {
    approvedChanges: Minor;
    pendingChanges: Minor;
    /** Payments received / asked for and not yet received. */
    paid: Minor;
    due: Minor;
  };
  /**
   * Approved projects: the money as the project's own strip shows it, GST
   * included where the payments carry it. Null when not approved/loaded.
   */
  money?: ProjectMoneyFigures | null;
};

export type ProjectMoneyFigures = {
  received: Minor;
  due: Minor;
  /** In the schedule, not asked for yet. */
  toAsk: Minor;
  total: Minor;
  tax: Minor;
  /** The payment to ask for next, when nothing is out or reported. */
  nextAsk: { label: string; amount: Minor } | null;
};

export type OverviewProject = ProjectFigures & {
  id: string;
  name: string;
  client: { name: string; phone: string | null } | null;
  sentAt: Date | null;
  lastDecision: {
    decision: "approved" | "rejected";
    at: Date;
    name: string;
    comment: string | null;
  } | null;
  updatedAt: Date;
  changeCount: number;
};

export type OverviewChange = {
  id: string;
  projectId: string;
  number: number;
  /** "CR-002". */
  label: string;
  title: string;
  total: Minor;
  status: "draft" | "sent" | "approved" | "rejected" | "withdrawn";
  everSent: boolean;
  sentAt: Date | null;
  updatedAt: Date;
};

/** A payment request still owed (due, or the client says paid). */
export type OverviewPayment = {
  id: string;
  projectId: string;
  label: string;
  amount: Minor;
  status: "due" | "client_reported";
  requestedAt: Date;
  reportedAt: Date | null;
};

export type AttentionItem = {
  key: string;
  /** "Proposal", "CR-002", "Draft"… */
  tag: string;
  tone: "waiting" | "neutral";
  title: string;
  /** Project · client · when. */
  detail: string;
  amount: string;
  href: string;
  /** A client note to show under the row. */
  quote: string | null;
  /** WhatsApp link, for things waiting on the client. */
  remind: string | null;
  /** "Send on WhatsApp" the first days, "Remind" after (isReminder). */
  remindLabel?: string;
};

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** A WhatsApp link with the message and the client's link, or null without a link. */
export function reminderLink(
  phone: string | null,
  url: string | null,
  text: string,
): string | null {
  if (!url) return null;
  const message = `${text} ${url}`;
  return phone
    ? whatsappLink(phone, message)
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Sent and not answered: proposals and change requests, longest wait first.
 * `links` holds each project's client link (null if it can't be shown).
 */
export function waitingOnClients(
  projects: readonly OverviewProject[],
  changes: readonly OverviewChange[],
  links: ReadonlyMap<string, string | null>,
  now: Date = new Date(),
  payments: readonly OverviewPayment[] = [],
): AttentionItem[] {
  const byId = new Map(projects.map((p) => [p.id, p]));
  const who = (p: OverviewProject) =>
    p.client ? firstName(p.client.name) : "there";
  const sent = (at: Date | null) =>
    at ? `sent ${formatAgo(at, { now })}` : null;
  const rows: { item: AttentionItem; since: number }[] = [];

  for (const p of projects.filter((p) => p.status === "awaiting_approval")) {
    const amount = formatMoney(p.baselineTotal, p.currency);
    rows.push({
      item: {
        key: `p-${p.id}`,
        tag: "Proposal",
        tone: "waiting",
        title: p.name,
        detail: [p.client?.name, sent(p.sentAt)].filter(Boolean).join(" · "),
        amount,
        href: `/projects/${p.id}`,
        quote: null,
        remind: reminderLink(
          p.client?.phone ?? null,
          links.get(p.id) ?? null,
          p.sentAt && isReminder(p.sentAt, now)
            ? `Hi ${who(p)}, just checking whether you've had a chance to look at the proposal for ${p.name} (${amount}). Here's the link:`
            : `Hi ${who(p)}, here's the proposal for ${p.name} (${amount}):`,
        ),
      },
      since: p.sentAt?.getTime() ?? 0,
    });
  }
  for (const c of changes.filter((c) => c.status === "sent")) {
    const p = byId.get(c.projectId);
    if (!p) continue;
    const amount = formatMoney(c.total, p.currency);
    const url = links.get(p.id);
    rows.push({
      item: {
        key: `c-${c.id}`,
        tag: c.label,
        tone: "waiting",
        title: c.title,
        detail: [p.name, sent(c.sentAt)].filter(Boolean).join(" · "),
        amount,
        href: `/projects/${p.id}/changes/${c.number}`,
        quote: null,
        remind: reminderLink(
          p.client?.phone ?? null,
          url ? `${url}/changes/${c.number}` : null,
          c.sentAt && isReminder(c.sentAt, now)
            ? `Hi ${who(p)}, just checking whether you've had a chance to look at ${c.label} for ${p.name}: ${c.title} (${amount}). Here's the link:`
            : `Hi ${who(p)}, here's ${c.label} for ${p.name}: ${c.title} (${amount}). You can approve or decline it here:`,
        ),
      },
      since: c.sentAt?.getTime() ?? 0,
    });
  }
  for (const pay of payments.filter((p) => p.status === "due")) {
    const p = byId.get(pay.projectId);
    if (!p) continue;
    const amount = formatMoney(pay.amount, p.currency);
    const url = links.get(p.id);
    rows.push({
      item: {
        key: `pay-${pay.id}`,
        tag: "Payment due",
        tone: "waiting",
        title: pay.label,
        detail: [p.name, `asked ${formatAgo(pay.requestedAt, { now })}`].join(
          " · ",
        ),
        amount,
        href: `/projects/${p.id}`,
        quote: null,
        remind: reminderLink(
          p.client?.phone ?? null,
          url ? `${url}/pay/${pay.id}` : null,
          isReminder(pay.requestedAt, now)
            ? `Hi ${who(p)}, a gentle reminder that the ${pay.label} payment for ${p.name} (${amount}) is due. You can pay here:`
            : `Hi ${who(p)}, here's the pay link for the ${pay.label} payment on ${p.name} (${amount}):`,
        ),
      },
      since: pay.requestedAt.getTime(),
    });
  }
  return rows
    .sort((a, b) => a.since - b.since)
    .map((r) => ({
      ...r.item,
      remindLabel:
        r.since && isReminder(new Date(r.since), now)
          ? "Remind"
          : "Send on WhatsApp",
    }));
}
