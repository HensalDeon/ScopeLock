import type { CurrencyCode } from "@/shared/lib/currency";
import { todayInIndia } from "@/shared/lib/dates";
import { minor, sum, type Minor } from "@/shared/lib/money";
import {
  financialYearOf,
  monthKeyOf,
  monthsOf,
  type FyMonth,
} from "./financial-year";

/**
 * Revenue recovered, for one financial year: the change requests clients
 * approved (the work's value, before GST, as on the overview), by month and
 * by client, with how much of each has been received so far. One report per
 * currency; currencies are never added together.
 */

export type ReportChange = {
  id: string;
  number: number;
  /** "CR-003". */
  label: string;
  title: string;
  projectId: string;
  currency: CurrencyCode;
  /** Before GST. */
  total: Minor;
  approvedAt: Date;
};

export type ReportProject = {
  name: string;
  clientId: string;
  clientName: string | null;
};

/** A payment's line for a change request: asked for (due) or received. */
export type ReportPaymentLine = {
  changeId: string;
  amount: Minor;
  state: "received" | "asked";
  invoice: string | null;
  /** "2026-11-18", for received lines. */
  receivedOn: string | null;
  /** When it was asked for, for lines still due. */
  askedAt: Date | null;
};

/** One approved change request: a CSV row, and a line in "Not received yet". */
export type ReportRow = {
  changeId: string;
  projectId: string;
  number: number;
  label: string;
  title: string;
  approvedAt: Date;
  /** "2026-11-18", India time. */
  approvedOn: string;
  projectName: string;
  clientId: string | null;
  clientName: string;
  currency: CurrencyCode;
  amount: Minor;
  received: Minor;
  /** Asked for and still due (on a payment request). */
  asked: Minor;
  /** Not asked for yet (e.g. it goes on the final payment). */
  notAsked: Minor;
  /** asked + notAsked. */
  outstanding: Minor;
  /** Invoice numbers of the payments it's on. */
  invoices: string[];
  lastReceivedOn: string | null;
  /** The oldest request still out for it: how long it's been waiting. */
  askedAt: Date | null;
};

export type ReportTotals = {
  count: number;
  approved: Minor;
  received: Minor;
  asked: Minor;
  notAsked: Minor;
  outstanding: Minor;
};

export type MonthLine = FyMonth & ReportTotals;
export type ClientLine = ReportTotals & {
  clientId: string | null;
  name: string;
};

export type CurrencyReport = ReportTotals & {
  currency: CurrencyCode;
  months: MonthLine[];
  /** Most still to receive first, then most approved. */
  clients: ClientLine[];
};

export type RecoveredReport = {
  fy: number;
  /** Oldest first, for the CSV. */
  rows: ReportRow[];
  /** Rupees first, then A–Z. */
  currencies: CurrencyReport[];
};

const NO_CLIENT = "No client";

function totals(rows: readonly ReportRow[]): ReportTotals {
  return {
    count: rows.length,
    approved: sum(rows.map((r) => r.amount)),
    received: sum(rows.map((r) => r.received)),
    asked: sum(rows.map((r) => r.asked)),
    notAsked: sum(rows.map((r) => r.notAsked)),
    outstanding: sum(rows.map((r) => r.outstanding)),
  };
}

export function recoveredReport(input: {
  fy: number;
  changes: readonly ReportChange[];
  /** Change-request lines of asked-for and received payments (before GST). */
  payments: readonly ReportPaymentLine[];
  projects: ReadonlyMap<string, ReportProject>;
  now: Date;
}): RecoveredReport {
  const lines = new Map<string, ReportPaymentLine[]>();
  for (const l of input.payments)
    lines.set(l.changeId, [...(lines.get(l.changeId) ?? []), l]);

  const rows: ReportRow[] = input.changes
    .filter((c) => financialYearOf(c.approvedAt) === input.fy)
    .sort((a, b) => a.approvedAt.getTime() - b.approvedAt.getTime())
    .map((c) => {
      const project = input.projects.get(c.projectId);
      const mine = lines.get(c.id) ?? [];
      const of = (state: ReportPaymentLine["state"]) =>
        sum(mine.filter((l) => l.state === state).map((l) => l.amount));
      // Never more than was approved (a later re-price can't overshoot).
      const received = minor(Math.min(of("received"), c.total));
      const asked = minor(Math.min(of("asked"), c.total - received));
      const dates = mine
        .map((l) => l.receivedOn)
        .filter((d): d is string => d !== null)
        .sort();
      return {
        changeId: c.id,
        projectId: c.projectId,
        number: c.number,
        label: c.label,
        title: c.title,
        approvedAt: c.approvedAt,
        approvedOn: todayInIndia(c.approvedAt),
        projectName: project?.name ?? "A deleted project",
        clientId: project?.clientId ?? null,
        clientName: project?.clientName ?? NO_CLIENT,
        currency: c.currency,
        amount: c.total,
        received,
        asked,
        notAsked: minor(c.total - received - asked),
        outstanding: minor(c.total - received),
        invoices: [
          ...new Set(
            mine.map((l) => l.invoice).filter((n): n is string => n !== null),
          ),
        ],
        lastReceivedOn: dates.at(-1) ?? null,
        askedAt:
          asked > 0
            ? (mine
                .map((l) => l.askedAt)
                .filter((d): d is Date => d !== null)
                .sort((a, b) => a.getTime() - b.getTime())[0] ?? null)
            : null,
      };
    });

  const currencies = [...new Set(rows.map((r) => r.currency))]
    .sort((a, b) =>
      a === b ? 0 : a === "INR" ? -1 : b === "INR" ? 1 : a.localeCompare(b),
    )
    .map((currency): CurrencyReport => {
      const mine = rows.filter((r) => r.currency === currency);
      const byClient = new Map<string, ReportRow[]>();
      for (const r of mine) {
        const key = r.clientId ?? NO_CLIENT;
        byClient.set(key, [...(byClient.get(key) ?? []), r]);
      }
      return {
        currency,
        ...totals(mine),
        months: monthsOf(input.fy, input.now).map((m) => ({
          ...m,
          ...totals(mine.filter((r) => monthKeyOf(r.approvedAt) === m.key)),
        })),
        clients: [...byClient.values()]
          .map((list) => ({
            clientId: list[0]?.clientId ?? null,
            name: list[0]?.clientName ?? NO_CLIENT,
            ...totals(list),
          }))
          .sort(
            (a, b) =>
              b.outstanding - a.outstanding ||
              b.approved - a.approved ||
              a.name.localeCompare(b.name),
          ),
      };
    });

  return { fy: input.fy, rows, currencies };
}

/** Years to offer: the current one and every year with an approval, newest first. */
export function reportYears(
  changes: readonly Pick<ReportChange, "approvedAt">[],
  now: Date,
): number[] {
  return [
    ...new Set([
      financialYearOf(now),
      ...changes.map((c) => financialYearOf(c.approvedAt)),
    ]),
  ].sort((a, b) => b - a);
}
