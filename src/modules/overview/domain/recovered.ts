import type { CurrencyCode } from "@/shared/lib/currency";
import { minor, sum, type Minor } from "@/shared/lib/money";

/**
 * Revenue recovered: extra work the client asked for, priced and approved
 * through ScopeLock, i.e. approved change requests (the work's value,
 * before GST). One line per currency, never summed across currencies.
 */
export type RecoveredTotals = {
  currency: CurrencyCode;
  /** Approved this calendar month (India time). */
  thisMonth: Minor;
  thisMonthCount: number;
  allTime: Minor;
  allTimeCount: number;
};

export type ApprovedChange = {
  currency: CurrencyCode;
  total: Minor;
  approvedAt: Date;
};

const monthOf = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
});

/** Sorted by all-time amount, largest first (the main currency leads). */
export function revenueRecovered(
  changes: readonly ApprovedChange[],
  now: Date = new Date(),
): RecoveredTotals[] {
  const month = monthOf.format(now);
  const byCurrency = new Map<CurrencyCode, ApprovedChange[]>();
  for (const c of changes) {
    byCurrency.set(c.currency, [...(byCurrency.get(c.currency) ?? []), c]);
  }
  return [...byCurrency.entries()]
    .map(([currency, list]) => {
      const recent = list.filter((c) => monthOf.format(c.approvedAt) === month);
      return {
        currency,
        thisMonth: sum(recent.map((c) => c.total)),
        thisMonthCount: recent.length,
        allTime: sum(list.map((c) => c.total)),
        allTimeCount: list.length,
      };
    })
    .filter((r) => r.allTime > minor(0))
    .sort((a, b) => b.allTime - a.allTime);
}
