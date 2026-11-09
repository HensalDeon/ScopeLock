import { z } from "zod";
import { joinLines, linesField } from "@/shared/lib/text-lines";

/**
 * Standard text a freelancer reuses on every proposal (Settings → Documents).
 * Pre-filled into new projects, then editable per project.
 */
export type ProposalDefaults = {
  terms: string[];
  exclusions: string[];
  clientProvides: string[];
};

export const LIST_LIMITS = { maxItems: 30, maxLength: 300 } as const;

/** A sensible starting point for an Indian web freelancer; fully editable. */
export const STARTER_PROPOSAL_DEFAULTS: ProposalDefaults = {
  terms: [
    "This proposal is valid until the date shown on it.",
    "Work starts once this scope is approved and the advance is received.",
    "Design includes 2 rounds of revisions. Further rounds are quoted as a change request.",
    "New pages or features requested after approval are priced as change requests before any work starts.",
    "Timelines depend on receiving content and feedback on time.",
    // Currency-neutral: projects can be billed in any supported currency.
    "Prices are in the currency shown on this proposal. GST or other taxes are extra where applicable.",
  ],
  exclusions: [
    "Domain registration and hosting fees",
    "Paid plugins, themes, fonts or stock images",
    "Copywriting, photography and video production",
    "Pages or features beyond the agreed scope",
  ],
  clientProvides: [
    "Logo and brand colours",
    "Text for each page",
    "Photos you'd like to use",
    "Feedback within 2 working days at each review",
  ],
};

export const PROPOSAL_DEFAULTS_FIELDS = [
  "terms",
  "exclusions",
  "clientProvides",
] as const;
export type ProposalDefaultsField = (typeof PROPOSAL_DEFAULTS_FIELDS)[number];

export const proposalDefaultsSchema = z.object({
  terms: linesField({ ...LIST_LIMITS, label: "term" }),
  exclusions: linesField({ ...LIST_LIMITS, label: "line" }),
  clientProvides: linesField({ ...LIST_LIMITS, label: "line" }),
});

export function defaultsToFormValues(
  defaults: ProposalDefaults,
): Record<ProposalDefaultsField, string> {
  return {
    terms: joinLines(defaults.terms),
    exclusions: joinLines(defaults.exclusions),
    clientProvides: joinLines(defaults.clientProvides),
  };
}

/** The GST sentence in the starter terms, rewritten per client below. */
const GST_SENTENCE = "GST or other taxes are extra where applicable.";

/**
 * Terms as this client should read them: the starter "GST … extra where
 * applicable" says what actually happens (GST added; none on an export;
 * nothing at all when you're not registered). Text you wrote stays as is.
 */
export function termsForTax(
  terms: readonly string[],
  taxCase: "gst" | "export" | "none" | null,
  gstPercent: number | null,
): string[] {
  if (!taxCase) return [...terms];
  const sentence =
    taxCase === "gst"
      ? `${gstPercent ?? 18}% GST is added on each invoice.`
      : taxCase === "export"
        ? "No GST is charged: this is an export of services, zero-rated under LUT."
        : "";
  return terms
    .map((t) =>
      t.includes(GST_SENTENCE)
        ? t.replace(GST_SENTENCE, sentence).replace(/\s+$/, "")
        : t,
    )
    .filter((t) => t.trim().length > 0);
}
