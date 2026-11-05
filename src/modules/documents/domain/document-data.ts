import type { Paise } from "@/shared/lib/money";

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
    amount: Paise;
  }[];
  total: Paise;
  billingModel: "upfront" | "milestones";
  milestones: { id: string; name: string; percent: number; amount: Paise }[];
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
    amount: Paise;
    unit: string | null;
  }[];
  clientProvides: string[];
  exclusions: string[];
  terms: string[];
};
