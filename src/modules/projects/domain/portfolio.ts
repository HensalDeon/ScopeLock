import type { CurrencyCode } from "@/shared/lib/currency";
import { minor, sum, type Minor } from "@/shared/lib/money";
import type { Project } from "./project";

export type CurrencyTotals = {
  currency: CurrencyCode;
  /** Approved proposals plus approved changes. */
  approved: Minor;
  approvedProjects: number;
  /** Sent proposals and change requests the client hasn't answered. */
  waiting: Minor;
  /** Drafts not yet sent. */
  draft: Minor;
  draftProjects: number;
};

/**
 * The money picture across projects, one row per currency (amounts in
 * different currencies are never added together). Rows with nothing in
 * them are left out; INR comes first.
 */
export function portfolioTotals(
  projects: readonly Pick<
    Project,
    "status" | "currency" | "baseline" | "totals"
  >[],
): CurrencyTotals[] {
  const rows = new Map<CurrencyCode, CurrencyTotals>();
  const row = (currency: CurrencyCode) => {
    let r = rows.get(currency);
    if (!r) {
      r = {
        currency,
        approved: minor(0),
        approvedProjects: 0,
        waiting: minor(0),
        draft: minor(0),
        draftProjects: 0,
      };
      rows.set(currency, r);
    }
    return r;
  };
  for (const p of projects) {
    if (p.status === "archived") continue;
    const r = row(p.currency);
    if (p.status === "active" || p.status === "completed") {
      r.approved = sum([
        r.approved,
        p.baseline.total,
        p.totals.approvedChanges,
      ]);
      r.approvedProjects += 1;
      r.waiting = sum([r.waiting, p.totals.pendingChanges]);
    } else if (p.status === "awaiting_approval") {
      r.waiting = sum([r.waiting, p.baseline.total]);
    } else {
      r.draft = sum([r.draft, p.baseline.total]);
      r.draftProjects += 1;
    }
  }
  return [...rows.values()].sort((a, b) =>
    a.currency === "INR"
      ? -1
      : b.currency === "INR"
        ? 1
        : a.currency.localeCompare(b.currency),
  );
}
