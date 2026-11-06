import type { CurrencyCode } from "@/shared/lib/currency";
import type { Minor } from "@/shared/lib/money";

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
  billingModel: "upfront" | "milestones";
  milestones: { id: string; name: string; percent: number; amount: Minor }[];
  timeline: {
    id: string;
    phase: string;
    duration: string | null;
    description: string | null;
    isMilestone: boolean;
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
  /** Where the money goes, in words: "Added to the “Before launch” payment." */
  billing: string;
  /** The approved proposal's total, for context. */
  originalTotal: Minor;
  issuedOn: Date;
};
