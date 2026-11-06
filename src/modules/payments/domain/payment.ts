import { z } from "zod";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, sum, type Minor } from "@/shared/lib/money";
import { METHOD_KINDS, type MethodKind } from "./methods";

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
  amount: Minor;
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
};

/** Requested and not cancelled: the slot is taken. */
export const isActive = (status: PaymentStatus) => status !== "cancelled";

/** Received and still owed, across a project's payments. */
export function paymentTotals(
  payments: readonly Pick<Payment, "status" | "amount">[],
): { received: Minor; due: Minor } {
  return {
    received: sum(
      payments.filter((p) => p.status === "confirmed").map((p) => p.amount),
    ),
    due: sum(
      payments
        .filter((p) => p.status === "due" || p.status === "client_reported")
        .map((p) => p.amount),
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
  total: Minor;
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
      total: payment ? payment.amount : sum(lines.map((l) => l.amount)),
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
      total: payment ? payment.amount : separate,
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

// ── What people type ───────────────────────────────────────────────────────

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.");

const notInFuture = (today: string) => (value: string) => value <= today;

/** The client's "I've paid" (the screenshot travels separately). */
export const REPORT_FIELDS = ["method", "reference", "paidOn", "note"] as const;
export type ReportField = (typeof REPORT_FIELDS)[number];

export function reportInputSchema(today: string) {
  return z.object({
    method: z.enum(METHOD_KINDS, { message: "Choose how you paid." }),
    reference: z
      .string()
      .trim()
      .min(4, "Add the UTR or transaction ID from your payment app or bank.")
      .max(
        40,
        "That reference is too long. Copy just the UTR or transaction ID.",
      )
      .regex(/^[A-Za-z0-9 _/-]+$/, "Use letters and numbers only."),
    paidOn: isoDate.refine(
      notInFuture(today),
      "The payment date can't be in the future.",
    ),
    note: z
      .string()
      .trim()
      .max(300, "Keep the note under 300 characters.")
      .transform((v) => v || null),
  });
}

/** The freelancer marking a payment received themselves. */
export const RECEIVE_FIELDS = [
  "paymentId",
  "method",
  "reference",
  "receivedOn",
] as const;
export function receiveInputSchema(today: string) {
  return z.object({
    method: z.enum(METHOD_KINDS, { message: "Choose how it was paid." }),
    reference: z
      .string()
      .trim()
      .max(40, "Keep the reference under 40 characters.")
      .transform((v) => v || null),
    receivedOn: isoDate.refine(
      notInFuture(today),
      "The date can't be in the future.",
    ),
  });
}

/** "Not received": the client sees this note. */
export const notReceivedSchema = z.object({
  note: z
    .string()
    .trim()
    .min(4, "Tell your client what's missing, so they can check.")
    .max(300, "Keep the note under 300 characters."),
});

export const PAYMENT_STATE_LABELS: Record<ScheduleState, string> = {
  upcoming: "Not requested",
  due: "Due",
  client_reported: "Client says paid",
  received: "Received",
};

/** The same states in the client's words (their portal). */
export const CLIENT_PAYMENT_LABELS: Record<ScheduleState, string> = {
  upcoming: "Not due yet",
  due: "Due",
  client_reported: "Sent for confirmation",
  received: "Paid",
};
