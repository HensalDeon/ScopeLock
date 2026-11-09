import type { CurrencyCode } from "@/shared/lib/currency";
import { formatDate } from "@/shared/lib/dates";
import { minor, sum, type Minor } from "@/shared/lib/money";

/**
 * The project statement: one page with the agreed scope, every change the
 * client saw and what happened to it, every payment and where it stands,
 * and the totals. Built the same way for the freelancer and the client.
 */

export type StatementInput = {
  business: { name: string; email: string | null; phone: string | null };
  client: { name: string; company: string | null } | null;
  projectTitle: string;
  /** "P-007". */
  reference: string;
  currency: CurrencyCode;
  agreed: { total: Minor; approvedBy: { name: string; at: Date } | null };
  /** Change requests the client has seen (never unsent drafts). */
  changes: {
    label: string;
    title: string;
    total: Minor;
    status: "draft" | "sent" | "approved" | "rejected" | "withdrawn";
    decision: {
      decision: "approved" | "rejected";
      name: string;
      at: Date;
    } | null;
  }[];
  /** The payment schedule, in order. */
  payments: {
    label: string;
    total: Minor;
    tax: Minor;
    payable: Minor;
    state: "upcoming" | "due" | "client_reported" | "received";
    invoiceNumber: string | null;
    requestedAt: Date | null;
    /** YYYY-MM-DD, as the freelancer recorded it. */
    receivedOn: string | null;
  }[];
  asOf: Date;
};

export type Statement = StatementInput & {
  changeRows: {
    label: string;
    title: string;
    status: string;
    amount: Minor;
    counts: boolean;
  }[];
  paymentRows: {
    label: string;
    invoice: string | null;
    status: string;
    amount: Minor;
    settled: boolean;
  }[];
  totals: {
    agreed: Minor;
    approvedChanges: Minor;
    /** Agreed scope + approved changes, before GST. */
    projectTotal: Minor;
    tax: Minor;
    /** What the whole schedule comes to, GST included. */
    withGst: Minor;
    received: Minor;
    /** Asked for (incl. reported as paid), not received yet. */
    due: Minor;
    toAsk: Minor;
  };
};

/** A record always carries the year: "9 Nov 2026". */
const day = (date: Date) => formatDate(date, { withYear: true });
const isoDay = (iso: string) => day(new Date(`${iso}T12:00:00+05:30`));

function changeStatus(c: StatementInput["changes"][number]): string {
  if (c.status === "approved" && c.decision)
    return `Approved by ${c.decision.name} on ${day(c.decision.at)}`;
  if (c.status === "rejected" && c.decision)
    return `Declined by ${c.decision.name} on ${day(c.decision.at)}`;
  if (c.status === "withdrawn") return "Cancelled";
  return "Waiting for an answer";
}

function paymentStatus(p: StatementInput["payments"][number]): string {
  switch (p.state) {
    case "received":
      return p.receivedOn ? `Received on ${isoDay(p.receivedOn)}` : "Received";
    case "client_reported":
      return "Paid, being confirmed";
    case "due":
      return p.requestedAt ? `Asked for on ${day(p.requestedAt)}` : "Asked for";
    case "upcoming":
      return "Not asked for yet";
  }
}

export function buildStatement(input: StatementInput): Statement {
  const shown = input.changes.filter((c) => c.status !== "draft");
  const approvedChanges = sum(
    shown.filter((c) => c.status === "approved").map((c) => c.total),
  );
  const pick = (states: StatementInput["payments"][number]["state"][]) =>
    sum(
      input.payments
        .filter((p) => states.includes(p.state))
        .map((p) => p.payable),
    );
  return {
    ...input,
    changeRows: shown.map((c) => ({
      label: c.label,
      title: c.title,
      status: changeStatus(c),
      amount: c.total,
      counts: c.status === "approved",
    })),
    paymentRows: input.payments.map((p) => ({
      label: p.label,
      invoice: p.invoiceNumber,
      status: paymentStatus(p),
      amount: p.payable,
      settled: p.state === "received",
    })),
    totals: {
      agreed: input.agreed.total,
      approvedChanges,
      projectTotal: sum([input.agreed.total, approvedChanges]),
      tax: sum(input.payments.map((p) => p.tax)),
      withGst: input.payments.length
        ? sum(input.payments.map((p) => p.payable))
        : sum([input.agreed.total, approvedChanges, minor(0)]),
      received: pick(["received"]),
      due: pick(["due", "client_reported"]),
      toAsk: pick(["upcoming"]),
    },
  };
}
