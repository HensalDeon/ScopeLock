import { formatAgo } from "@/shared/lib/dates";
import { formatMoney } from "@/shared/lib/money";
import {
  firstName,
  type AttentionItem,
  type OverviewChange,
  type OverviewPayment,
  type OverviewProject,
} from "./overview";

/**
 * What needs the freelancer, most urgent first: payments a client says
 * they've sent, proposals the client asked to change, the next payment
 * nobody has asked for yet, then drafts not sent (latest first).
 */
export function needsYou(
  projects: readonly OverviewProject[],
  changes: readonly OverviewChange[],
  now: Date = new Date(),
  payments: readonly OverviewPayment[] = [],
  /** A UPI ID, bank or link is saved; asking needs one first. */
  paymentsReady = true,
): AttentionItem[] {
  const byId = new Map(projects.map((p) => [p.id, p]));
  const rows: { item: AttentionItem; rank: number; at: number }[] = [];

  // A client says they've paid: check and confirm first.
  for (const pay of payments.filter((p) => p.status === "client_reported")) {
    const p = byId.get(pay.projectId);
    if (!p) continue;
    rows.push({
      item: {
        key: `pay-${pay.id}`,
        tag: "Client says paid",
        tone: "waiting",
        title: pay.label,
        detail: `${p.name} · ${p.client?.name ?? "Your client"} paid ${formatAgo(pay.reportedAt ?? pay.requestedAt, { now })} · check and confirm`,
        amount: formatMoney(pay.amount, p.currency),
        href: `/projects/${p.id}`,
        quote: null,
        remind: null,
      },
      rank: -1,
      at: (pay.reportedAt ?? pay.requestedAt).getTime(),
    });
  }

  // Approved work with nothing asked for: the same step as the project's
  // own strip ("Ask Rahul for ₹9,600"), so the two never disagree.
  for (const p of projects) {
    const next = p.money?.nextAsk;
    if (!next) continue;
    const who = p.client ? firstName(p.client.name) : "your client";
    rows.push({
      item: {
        key: `ask-${p.id}`,
        tag: "Next payment",
        tone: "neutral",
        title: next.label,
        detail: paymentsReady
          ? `${p.name} · not asked yet · ask ${who} when it's due`
          : `${p.name} · add how you get paid before you ask ${who}`,
        amount: formatMoney(next.amount, p.currency),
        href: paymentsReady ? `/projects/${p.id}` : "/settings/payments",
        quote: null,
        remind: null,
      },
      rank: 0.5,
      at: p.updatedAt.getTime(),
    });
  }

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
