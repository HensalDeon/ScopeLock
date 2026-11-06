import type { CurrencyCode } from "@/shared/lib/currency";
import { formatAgo } from "@/shared/lib/dates";
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
  totals: { approvedChanges: Minor; pendingChanges: Minor };
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
  /** WhatsApp reminder link, for things waiting on the client. */
  remind: string | null;
};

export type SetupStep = {
  title: string;
  detail: string;
  done: boolean;
  href?: "/clients/new" | "/projects/new";
};

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export function setupSteps(input: {
  businessName: string;
  businessTypeTitle: string;
  clientCount: number;
  projects: readonly Pick<OverviewProject, "status" | "changeCount">[];
}): SetupStep[] {
  const { projects } = input;
  return [
    {
      title: "Set up your workspace",
      detail: `${input.businessName} · ${input.businessTypeTitle}`,
      done: true,
    },
    {
      title: "Add your first client",
      detail: "Their name, company and WhatsApp number.",
      done: input.clientCount > 0,
      href: "/clients/new",
    },
    {
      title: "Write down a project's scope",
      detail: "List what's included, the price, and how the client pays.",
      done: projects.length > 0,
      href: "/projects/new",
    },
    {
      title: "Get the scope approved",
      detail:
        "Send it to your client. Once they approve, it's locked as the baseline.",
      done: projects.some(
        (p) => p.status === "active" || p.status === "completed",
      ),
    },
    {
      title: "Log extra requests as they come in",
      detail:
        "Each one becomes a priced change request your client approves before you start.",
      done: projects.some((p) => p.changeCount > 0),
    },
  ];
}

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
          `Hi ${who(p)}, just checking whether you've had a chance to look at the proposal for ${p.name} (${amount}). Here's the link:`,
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
          `Hi ${who(p)}, just checking whether you've had a chance to look at ${c.label} for ${p.name}: ${c.title} (${amount}). Here's the link:`,
        ),
      },
      since: c.sentAt?.getTime() ?? 0,
    });
  }
  return rows.sort((a, b) => a.since - b.since).map((r) => r.item);
}

/** Changes the client asked for (first), then drafts not sent (latest first). */
export function needsYou(
  projects: readonly OverviewProject[],
  changes: readonly OverviewChange[],
  now: Date = new Date(),
): AttentionItem[] {
  const byId = new Map(projects.map((p) => [p.id, p]));
  const rows: { item: AttentionItem; rank: number; at: number }[] = [];

  for (const p of projects.filter((p) => p.status === "draft")) {
    const asked =
      p.lastDecision?.decision === "rejected" &&
      p.sentAt &&
      p.lastDecision.at >= p.sentAt
        ? p.lastDecision
        : null;
    const client = p.client?.name ?? "No client";
    rows.push({
      item: {
        key: `p-${p.id}`,
        tag: asked ? "Changes asked" : p.sentAt ? "Taken back" : "Draft",
        tone: asked ? "waiting" : "neutral",
        title: p.name,
        detail: asked
          ? `${asked.name} asked ${formatAgo(asked.at, { now })} · edit and send again`
          : `${client} · not sent ${p.sentAt ? "again " : ""}yet`,
        amount: formatMoney(p.baselineTotal, p.currency),
        href: `/projects/${p.id}`,
        quote: asked?.comment ?? null,
        remind: null,
      },
      rank: asked ? 0 : 1,
      at: p.updatedAt.getTime(),
    });
  }
  for (const c of changes.filter((c) => c.status === "draft")) {
    const p = byId.get(c.projectId);
    if (!p) continue;
    rows.push({
      item: {
        key: `c-${c.id}`,
        tag: `${c.label} · ${c.everSent ? "Taken back" : "Draft"}`,
        tone: "neutral",
        title: c.title,
        detail: `${p.name} · not sent ${c.everSent ? "again " : ""}yet`,
        amount: formatMoney(c.total, p.currency),
        href: `/projects/${p.id}/changes/${c.number}`,
        quote: null,
        remind: null,
      },
      rank: 1,
      at: c.updatedAt.getTime(),
    });
  }
  return rows.sort((a, b) => a.rank - b.rank || b.at - a.at).map((r) => r.item);
}
