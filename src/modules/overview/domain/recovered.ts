import type { CurrencyCode } from "@/shared/lib/currency";
import { minor, sum, type Minor } from "@/shared/lib/money";
import { byCurrencyOrder } from "./portfolio";

/**
 * Revenue recovered: extra work the client asked for, priced and approved
 * through ScopeLock, i.e. approved change requests (the work's value,
 * before GST: GST isn't the freelancer's income). Approval isn't payment,
 * so each line also says how much of it has been received. One line per
 * currency, never summed across currencies.
 */
export type RecoveredTotals = {
  currency: CurrencyCode;
  /** Approved this calendar month (India time). */
  thisMonth: Minor;
  thisMonthCount: number;
  allTime: Minor;
  allTimeCount: number;
  /** Of the approved changes' value, what payments have confirmed. */
  received: Minor;
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

/** In the overview's currency order (rupees first), like the money strip. */
export function revenueRecovered(
  changes: readonly ApprovedChange[],
  now: Date = new Date(),
  /** Change-request lines of confirmed payments (before GST). */
  received: readonly { currency: CurrencyCode; amount: Minor }[] = [],
): RecoveredTotals[] {
  const month = monthOf.format(now);
  const byCurrency = new Map<CurrencyCode, ApprovedChange[]>();
  for (const c of changes) {
    byCurrency.set(c.currency, [...(byCurrency.get(c.currency) ?? []), c]);
  }
  return [...byCurrency.entries()]
    .map(([currency, list]) => {
      const recent = list.filter((c) => monthOf.format(c.approvedAt) === month);
      const allTime = sum(list.map((c) => c.total));
      const paid = sum(
        received.filter((r) => r.currency === currency).map((r) => r.amount),
      );
      return {
        currency,
        thisMonth: sum(recent.map((c) => c.total)),
        thisMonthCount: recent.length,
        allTime,
        allTimeCount: list.length,
        // Never more than was approved (a later re-price can't overshoot).
        received: minor(Math.min(paid, allTime)),
      };
    })
    .filter((r) => r.allTime > minor(0))
    .sort(byCurrencyOrder);
}

/** The most recently approved change, to name what the number is made of. */
export function latestApproved<T extends { approvedAt: Date }>(
  changes: readonly T[],
): T | null {
  return changes.reduce<T | null>(
    (latest, c) => (!latest || c.approvedAt > latest.approvedAt ? c : latest),
    null,
  );
}
