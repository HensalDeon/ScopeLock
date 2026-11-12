import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, minor, sum, type Minor } from "@/shared/lib/money";
import type { MethodKind } from "./methods";

/**
 * A payment request: an amount the freelancer has asked for (a milestone,
 * possibly with approved changes added, or a change paid separately). Its
 * lines and amount are frozen when it's requested.
 */
export const PAYMENT_STATUSES = [
  "due",
  "client_reported",
  "confirmed",
  "cancelled",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type PaymentLine = {
  kind: "baseline" | "change_request";
  /** Milestone id or change request id. */
  refId: string;
  description: string;
  amount: Minor;
};

export type Payment = {
  id: string;
  projectId: string;
  /** The milestone id, or "cr:<id>" for a change paid separately. */
  key: string;
  label: string;
  lines: PaymentLine[];
  /** The work being paid for (taxable value). */
  amount: Minor;
  /** GST on the invoice (zero without a GSTIN, and on older requests). */
  tax: Minor;
  /** What the client pays: amount + GST. */
  payable: Minor;
  /** The invoice issued with the request (older requests have none). */
  invoice: { id: string; number: string } | null;
  currency: CurrencyCode;
  status: PaymentStatus;
  requestedAt: Date;
  report: {
    method: MethodKind;
    reference: string;
    paidOn: string;
    note: string | null;
    hasProof: boolean;
    reportedAt: Date;
  } | null;
  confirmation: {
    method: MethodKind;
    reference: string | null;
    receivedOn: string;
    confirmedAt: Date;
    by: string;
  } | null;
  /** Why the freelancer said "not received" last time, if they did. */
  lastRejection: { note: string; at: Date } | null;
  /** When it last became due: asked for, or marked "not received". */
  dueSince: Date;
  /** Automatic reminders sent (oldest first), and whether they're paused. */
  autoReminders: { sent: Date[]; paused: boolean };
};

/** Requested and not cancelled: the slot is taken. */
export const isActive = (status: PaymentStatus) => status !== "cancelled";

/**
 * Received and still owed across a project's payments: what the client
 * pays, GST included (money that actually moves).
 */
export function paymentTotals(
  payments: readonly Pick<Payment, "status" | "payable">[],
): { received: Minor; due: Minor } {
  return {
    received: sum(
      payments.filter((p) => p.status === "confirmed").map((p) => p.payable),
    ),
    due: sum(
      payments
        .filter((p) => p.status === "due" || p.status === "client_reported")
        .map((p) => p.payable),
    ),
  };
}

// ── The schedule: what's owed and when ─────────────────────────────────────

export type MilestoneInput = {
  id: string;
  name: string;
  percent: number;
  baseAmount: Minor;
  order: number;
};

export type ApprovedChangeInput = {
  id: string;
  /** "CR-001". */
  label: string;
  title: string;
  /** Where its money goes (fixed at approval; null milestone = separate). */
  placement: { milestoneId: string | null; amount: Minor }[];
};

export type ScheduleState = "upcoming" | "due" | "client_reported" | "received";

export type ScheduleItem = {
  key: string;
  label: string;
  milestoneId: string | null;
  percent: number | null;
  lines: PaymentLine[];
  /** The work being paid for (before GST). */
  total: Minor;
  /** GST: from the invoice once asked for, else what it will add (see gst.ts). */
  tax: Minor;
  /** What the client pays: total + tax. */
  payable: Minor;
  /** "CGST 9% + SGST 9%" before it's asked for (the invoice has it after). */
  taxSplit: string | null;
  /** The active request for this slot, if any. */
  payment: Payment | null;
  state: ScheduleState;
};

const stateOf = (payment: Payment | null): ScheduleState =>
  !payment
    ? "upcoming"
    : payment.status === "confirmed"
      ? "received"
      : payment.status === "client_reported"
        ? "client_reported"
        : "due";

/** A requested slot shows what was asked for, GST included. */
const priced = (payment: Payment | null, computed: Minor) =>
  payment
    ? {
        total: payment.amount,
        tax: payment.tax,
        payable: payment.payable,
        taxSplit: null,
      }
    : { total: computed, tax: minor(0), payable: computed, taxSplit: null };

/**
 * Every payment on a project, in order: each milestone (its share of the
 * agreed price plus approved changes placed on it), then changes paid
 * separately. A slot that has been requested shows exactly what was asked
 * for, frozen at that moment.
 */
export function buildSchedule(input: {
  milestones: readonly MilestoneInput[];
  baselineTotal: Minor;
  currency: CurrencyCode;
  changes: readonly ApprovedChangeInput[];
  payments: readonly Payment[];
}): ScheduleItem[] {
  const active = new Map(
    input.payments.filter((p) => isActive(p.status)).map((p) => [p.key, p]),
  );
  const agreed = formatMoney(input.baselineTotal, input.currency);
  const items: ScheduleItem[] = [];

  const sorted = [...input.milestones].sort((a, b) => a.order - b.order);
  for (const m of sorted) {
    const computed: PaymentLine[] = [
      {
        kind: "baseline",
        refId: m.id,
        description:
          sorted.length === 1
            ? `Agreed scope (${agreed})`
            : `${m.percent}% of the agreed ${agreed}`,
        amount: m.baseAmount,
      },
      ...input.changes.flatMap((c) =>
        c.placement
          .filter((p) => p.milestoneId === m.id)
          .map((p) => ({
            kind: "change_request" as const,
            refId: c.id,
            description: `${c.label} ${c.title}`,
            amount: p.amount,
          })),
      ),
    ];
    const payment = active.get(m.id) ?? null;
    const lines = payment ? payment.lines : computed;
    items.push({
      key: m.id,
      label: m.name,
      milestoneId: m.id,
      percent: m.percent,
      lines,
      ...priced(payment, sum(lines.map((l) => l.amount))),
      payment,
      state: stateOf(payment),
    });
  }

  for (const c of input.changes) {
    const separate = sum(
      c.placement.filter((p) => p.milestoneId === null).map((p) => p.amount),
    );
    if (separate <= 0) continue;
    const key = `cr:${c.id}`;
    const payment = active.get(key) ?? null;
    const lines: PaymentLine[] = payment
      ? payment.lines
      : [
          {
            kind: "change_request",
            refId: c.id,
            description: `${c.label} ${c.title}`,
            amount: separate,
          },
        ];
    items.push({
      key,
      label: `${c.label} ${c.title}`,
      milestoneId: null,
      percent: null,
      lines,
      ...priced(payment, separate),
      payment,
      state: stateOf(payment),
    });
  }
  return items;
}

/** Keys of slots already requested (a new change never lands in these). */
export function closedKeys(
  payments: readonly Pick<Payment, "key" | "status">[],
): string[] {
  return payments.filter((p) => isActive(p.status)).map((p) => p.key);
}

/**
 * A payment made of more than one thing, in a few words: "₹12,800 agreed
 * + ₹15,000 CR-001". Null for a single line (the label already says it).
 */
export function lineBreakdown(
  lines: readonly Pick<PaymentLine, "kind" | "description" | "amount">[],
  money: (amount: Minor) => string,
): string | null {
  if (lines.length < 2) return null;
  return lines
    .map(
      (l) =>
        `${money(l.amount)} ${l.kind === "baseline" ? "agreed" : (l.description.split(" ")[0] ?? "change")}`,
    )
    .join(" + ");
}
