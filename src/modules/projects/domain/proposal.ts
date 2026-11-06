import { z } from "zod";
import type { Minor } from "@/shared/lib/money";
import { linesField } from "@/shared/lib/text-lines";
import { amountField } from "./scope";

/**
 * The optional "proposal" sections around the priced scope: what turns a list
 * of lines into something that reads like a proper quotation. Every section is
 * optional; an empty one simply isn't shown to the client.
 */
export type Highlight = { value: string; label: string };
export type TimelineStep = {
  id: string;
  phase: string;
  duration: string | null;
  description: string | null;
  isMilestone: boolean;
};
export type Addon = {
  id: string;
  title: string;
  description: string | null;
  amount: Minor;
  unit: string | null;
};

export type ProposalContent = {
  title: string | null;
  subtitle: string | null;
  overview: string | null;
  callout: string | null;
  highlights: Highlight[];
  timeline: TimelineStep[];
  clientProvides: string[];
  exclusions: string[];
  terms: string[];
  addons: Addon[];
  /** yyyy-mm-dd, the last day the quoted prices hold. */
  validUntil: string | null;
};

export const EMPTY_PROPOSAL: ProposalContent = {
  title: null,
  subtitle: null,
  overview: null,
  callout: null,
  highlights: [],
  timeline: [],
  clientProvides: [],
  exclusions: [],
  terms: [],
  addons: [],
  validUntil: null,
};

export const PROPOSAL_LIMITS = {
  title: 120,
  subtitle: 200,
  overview: 3000,
  callout: 500,
  highlights: 6,
  highlightValue: 20,
  highlightLabel: 40,
  timeline: 15,
  phase: 80,
  duration: 30,
  stepDescription: 300,
  addons: 20,
  addonTitle: 120,
  addonDescription: 300,
  unit: 20,
  listItems: 30,
  listItemLength: 300,
} as const;

const optionalText = (max: number, what: string) =>
  z
    .string()
    .trim()
    .max(max, `Keep the ${what} under ${max} characters.`)
    .optional()
    .transform((value) => value || null);

const L = PROPOSAL_LIMITS;

export const proposalInputSchema = z.object({
  title: optionalText(L.title, "title"),
  subtitle: optionalText(L.subtitle, "subtitle"),
  overview: optionalText(L.overview, "overview"),
  callout: optionalText(L.callout, "note"),
  highlights: z
    .array(
      z.object({
        value: z
          .string()
          .trim()
          .min(1, "Add the number, e.g. 5.")
          .max(
            L.highlightValue,
            `Keep it under ${L.highlightValue} characters.`,
          ),
        label: z
          .string()
          .trim()
          .min(1, "Add a label, e.g. Custom pages.")
          .max(
            L.highlightLabel,
            `Keep it under ${L.highlightLabel} characters.`,
          ),
      }),
    )
    .max(L.highlights, `Up to ${L.highlights} highlights.`),
  timeline: z
    .array(
      z.object({
        id: z.uuid().optional(),
        phase: z
          .string()
          .trim()
          .min(1, "Name this step, e.g. Design.")
          .max(L.phase, `Keep it under ${L.phase} characters.`),
        duration: optionalText(L.duration, "duration"),
        description: optionalText(L.stepDescription, "description"),
        isMilestone: z.boolean().default(false),
      }),
    )
    .max(L.timeline, `Up to ${L.timeline} steps.`),
  clientProvides: linesField({
    maxItems: L.listItems,
    maxLength: L.listItemLength,
    label: "line",
  }),
  exclusions: linesField({
    maxItems: L.listItems,
    maxLength: L.listItemLength,
    label: "line",
  }),
  terms: linesField({
    maxItems: L.listItems,
    maxLength: L.listItemLength,
    label: "term",
  }),
  addons: z
    .array(
      z.object({
        id: z.uuid().optional(),
        title: z
          .string()
          .trim()
          .min(1, "Name the add-on.")
          .max(L.addonTitle, `Keep it under ${L.addonTitle} characters.`),
        description: optionalText(L.addonDescription, "description"),
        amount: amountField,
        unit: optionalText(L.unit, "unit"),
      }),
    )
    .max(L.addons, `Up to ${L.addons} add-ons.`),
  validUntil: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null)
    .refine(
      (value) =>
        value === null ||
        (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))),
      "Choose a date.",
    ),
});

export type ProposalInput = z.output<typeof proposalInputSchema>;

/** Stored proposal content: ids for timeline steps and add-ons. */
export function buildProposal(
  input: ProposalInput,
  newId: () => string,
): ProposalContent {
  return {
    ...input,
    timeline: input.timeline.map((step) => ({
      ...step,
      id: step.id ?? newId(),
    })),
    addons: input.addons.map((addon) => ({
      ...addon,
      id: addon.id ?? newId(),
    })),
  };
}

/** True when there's anything beyond the priced scope worth a section. */
export function hasProposalSections(p: ProposalContent): boolean {
  return Boolean(
    p.overview ||
    p.callout ||
    p.highlights.length ||
    p.timeline.length ||
    p.clientProvides.length ||
    p.exclusions.length ||
    p.terms.length ||
    p.addons.length,
  );
}
