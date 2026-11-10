import type { CurrencyCode } from "@/shared/lib/currency";
import { minor, sum, type Minor } from "@/shared/lib/money";
import type { ProjectFigures } from "./overview";

/**
 * One currency's money picture, counted the way each project's own strip
 * counts it (received, due now, still to ask for, total), so the overview
 * and a project page never disagree. Figures include GST where the
 * payments carry it.
 */
export type CurrencyTotals = {
  currency: CurrencyCode;
  /** Approved projects (proposal approved, in progress or done). */
  approvedProjects: number;
  /** Payments confirmed received. */
  received: Minor;
  /** Asked for and not received yet (incl. ones the client says are paid). */
  due: Minor;
  /** In the schedule but not asked for yet. */
  toAsk: Minor;
  /** Every payment in the approved schedules: the approved work, plus GST. */
  total: Minor;
  /** The GST inside `total` (0 when none). */
  tax: Minor;
  /** Sent proposals and change requests the client hasn't answered. */
  waiting: Minor;
  /** Drafts not yet sent. */
  draft: Minor;
  draftProjects: number;
};

const empty = (currency: CurrencyCode): CurrencyTotals => ({
  currency,
  approvedProjects: 0,
  received: minor(0),
  due: minor(0),
  toAsk: minor(0),
  total: minor(0),
  tax: minor(0),
  waiting: minor(0),
  draft: minor(0),
  draftProjects: 0,
});

/**
 * The money picture across projects, one row per currency (amounts in
 * different currencies are never added together). INR comes first.
 */
export function portfolioTotals(
  projects: readonly ProjectFigures[],
): CurrencyTotals[] {
  const rows = new Map<CurrencyCode, CurrencyTotals>();
  const row = (currency: CurrencyCode) => {
    const r = rows.get(currency) ?? empty(currency);
    rows.set(currency, r);
    return r;
  };
  for (const p of projects) {
    if (p.status === "archived") continue;
    const r = row(p.currency);
    if (p.status === "active" || p.status === "completed") {
      r.approvedProjects += 1;
      r.waiting = sum([r.waiting, p.totals.pendingChanges]);
      const m = p.money;
      if (m) {
        r.received = sum([r.received, m.received]);
        r.due = sum([r.due, m.due]);
        r.total = sum([r.total, m.total]);
        r.tax = sum([r.tax, m.tax]);
        r.toAsk = sum([r.toAsk, m.toAsk]);
      } else {
        // No schedule loaded: the stored figures, before GST.
        const total = sum([p.baselineTotal, p.totals.approvedChanges]);
        r.received = sum([r.received, p.totals.paid]);
        r.due = sum([r.due, p.totals.due]);
        r.total = sum([r.total, total]);
        r.toAsk = sum([
          r.toAsk,
          minor(Math.max(0, total - p.totals.paid - p.totals.due)),
        ]);
      }
    } else if (p.status === "awaiting_approval") {
      r.waiting = sum([r.waiting, p.baselineTotal]);
    } else {
      r.draft = sum([r.draft, p.baselineTotal]);
      r.draftProjects += 1;
    }
  }
  return [...rows.values()].sort(byCurrencyOrder);
}

/** Rupees first, then the other currencies A–Z: the overview's one order. */
export function byCurrencyOrder(
  a: { currency: CurrencyCode },
  b: { currency: CurrencyCode },
): number {
  if (a.currency === b.currency) return 0;
  if (a.currency === "INR") return -1;
  if (b.currency === "INR") return 1;
  return a.currency.localeCompare(b.currency);
}

/**
 * What each client owes right now (payments asked for and not received),
 * per currency. `clientOf` maps project id → client id.
 */
export function dueByClient(
  payments: readonly {
    projectId: string;
    amount: Minor;
    currency: CurrencyCode;
    status: string;
  }[],
  clientOf: ReadonlyMap<string, string>,
): Map<string, { currency: CurrencyCode; amount: Minor }[]> {
  const out = new Map<string, { currency: CurrencyCode; amount: Minor }[]>();
  for (const p of payments) {
    if (p.status !== "due" && p.status !== "client_reported") continue;
    const client = clientOf.get(p.projectId);
    if (!client) continue;
    const rows = out.get(client) ?? [];
    const row = rows.find((r) => r.currency === p.currency);
    if (row) row.amount = sum([row.amount, p.amount]);
    else rows.push({ currency: p.currency, amount: p.amount });
    out.set(client, rows);
  }
  return out;
}
