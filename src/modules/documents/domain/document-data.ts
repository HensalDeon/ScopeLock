import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, percentOf, sum, type Minor } from "@/shared/lib/money";

/**
 * Everything a proposal document shows, as plain data. Pages build it from
 * the workspace, client and project; the template only renders it. The same
 * shape becomes the approval snapshot in Phase 3B, so the record holds
 * exactly what the client saw.
 */
export type ProposalDocumentData = {
  /** "I" for freelancers, "we" for studios and agencies. */
  voice: "I" | "we";
  business: {
    name: string;
    tagline: string | null;
    email: string | null;
    phone: string | null;
  };
  client: {
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  reference: string;
  /** Every amount in the document is in this currency. */
  currency: CurrencyCode;
  title: string;
  subtitle: string | null;
  issuedOn: Date;
  validUntil: Date | null;
  overview: string | null;
  callout: string | null;
  highlights: { value: string; label: string }[];
  items: {
    id: string;
    title: string;
    description: string | null;
    includes: string[];
    amount: Minor;
  }[];
  total: Minor;
  /** GST added on invoices (18), or null when no GST applies. Missing on older proposals. */
  gstPercent?: number | null;
  billingModel: "upfront" | "milestones";
  milestones: {
    id: string;
    name: string;
    percent: number;
    amount: Minor;
    /** "Before work starts", "After Design (Week 2)". Missing on older proposals. */
    dueWhen?: string | null;
  }[];
  timeline: {
    id: string;
    phase: string;
    duration: string | null;
    description: string | null;
    isMilestone: boolean;
    /** The payment this milestone unlocks. Missing on older proposals. */
    payment?: { name: string; amount: Minor } | null;
  }[];
  addons: {
    id: string;
    title: string;
    description: string | null;
    amount: Minor;
    unit: string | null;
  }[];
  clientProvides: string[];
  exclusions: string[];
  terms: string[];
};

/**
 * A change order: one change request as the client sees and approves it.
 * Frozen when sent; the same shape is the approval snapshot.
 */
export type ChangeOrderData = {
  voice: "I" | "we";
  business: ProposalDocumentData["business"];
  client: ProposalDocumentData["client"];
  /** "CR-001". */
  reference: string;
  /** The approved proposal it changes: "P-1F107C". */
  projectReference: string;
  projectTitle: string;
  currency: CurrencyCode;
  title: string;
  description: string | null;
  items: {
    id: string;
    title: string;
    description: string | null;
    amount: Minor;
  }[];
  total: Minor;
  /** GST added on invoices (18), or null. Missing on older change orders. */
  gstPercent?: number | null;
  /** Where the money goes, in words: "Added to the “Before launch” payment." */
  billing: string;
  /** The approved proposal's total, for context. */
  originalTotal: Minor;
  issuedOn: Date;
};

/**
 * The amount a client approves, as they'll pay it: "₹94,400 with GST" when
 * the document adds GST, else just "₹80,000". Same figure as the sheet.
 */
export function approvalAmount(
  total: Minor,
  gstPercent: number | null | undefined,
  currency: CurrencyCode,
): string {
  if (!gstPercent) return formatMoney(total, currency);
  return `${formatMoney(sum([total, percentOf(total, gstPercent)]), currency)} with GST`;
}

/**
 * When a client's GST treatment has changed since the proposal was sent
 * (moved abroad, new GSTIN), the signed proposal stays as it is: GST isn't
 * part of the agreed price, it follows each invoice. This says so, in a
 * line under the document. Null when nothing changed, or for proposals from
 * before GST was shown on them.
 */
export function gstChangeNote(input: {
  /** gstPercent on the sent proposal (undefined on older ones). */
  shown: number | null | undefined;
  now: { gstPercent: number | null; taxCase: "gst" | "export" | "none" };
  clientName: string;
  /** The agreed price, formatted ("₹80,000"). */
  agreed: string;
}): string | null {
  if (input.shown === undefined) return null;
  if ((input.shown ?? null) === input.now.gstPercent) return null;
  const now =
    input.now.taxCase === "gst"
      ? `${input.now.gstPercent ?? 18}% GST is added`
      : input.now.taxCase === "export"
        ? "no GST is charged, as an export of services"
        : "no GST is charged";
  return `GST on this proposal was worked out from ${input.clientName}'s details when it was sent. Invoices follow the current details, so ${now}. The agreed price, ${input.agreed}, hasn't changed.`;
}
