import { PROPOSAL_LIMITS } from "../domain/proposal";

/**
 * The proposal part of the project form: which optional sections are on,
 * and their values as typed. Rows carry a `key` for React and "touched".
 */
export const PROPOSAL_SECTIONS = [
  { id: "heading", label: "Title & subtitle" },
  { id: "overview", label: "Overview" },
  { id: "highlights", label: "Highlights" },
  { id: "timeline", label: "Timeline" },
  { id: "addons", label: "Optional add-ons" },
  { id: "clientProvides", label: "What you need" },
  { id: "exclusions", label: "Not included" },
  { id: "terms", label: "Terms" },
  { id: "validUntil", label: "Valid until" },
] as const;
export type ProposalSectionId = (typeof PROPOSAL_SECTIONS)[number]["id"];

type Row<T> = T & { key: string };
export type ProposalFormValue = {
  active: ProposalSectionId[];
  title: string;
  subtitle: string;
  overview: string;
  callout: string;
  highlights: Row<{ value: string; label: string }>[];
  timeline: Row<{
    id?: string;
    phase: string;
    duration: string;
    description: string;
    isMilestone: boolean;
    /** Which payment this milestone unlocks: "" for none, else its position ("0", "1"…). */
    paymentOrder: string;
  }>[];
  addons: Row<{
    id?: string;
    title: string;
    description: string;
    amount: string;
    unit: string;
  }>[];
  clientProvides: string;
  exclusions: string;
  terms: string;
  validUntil: string;
};

let counter = 0;
export const proposalRowKey = () => `p-${++counter}`;

/** What the server receives: only the sections that are switched on. */
export function proposalToJson(v: ProposalFormValue): string {
  const on = (id: ProposalSectionId) => v.active.includes(id);
  const strip = <T extends { key: string }>(row: T): Omit<T, "key"> => {
    const { key, ...rest } = row;
    void key;
    return rest;
  };
  return JSON.stringify({
    title: on("heading") ? v.title : "",
    subtitle: on("heading") ? v.subtitle : "",
    overview: on("overview") ? v.overview : "",
    callout: on("overview") ? v.callout : "",
    highlights: on("highlights") ? v.highlights.map(strip) : [],
    timeline: on("timeline")
      ? v.timeline.map((step) => {
          const { paymentOrder, ...rest } = strip(step);
          return {
            ...rest,
            paymentOrder:
              step.isMilestone && paymentOrder !== ""
                ? Number(paymentOrder)
                : null,
          };
        })
      : [],
    addons: on("addons") ? v.addons.map(strip) : [],
    clientProvides: on("clientProvides") ? v.clientProvides : "",
    exclusions: on("exclusions") ? v.exclusions : "",
    terms: on("terms") ? v.terms : "",
    validUntil: on("validUntil") ? v.validUntil : "",
  });
}

export const newHighlight = () => ({
  key: proposalRowKey(),
  value: "",
  label: "",
});
export const newStep = () => ({
  key: proposalRowKey(),
  phase: "",
  duration: "",
  description: "",
  isMilestone: false,
  paymentOrder: "",
});
export const newAddon = () => ({
  key: proposalRowKey(),
  title: "",
  description: "",
  amount: "",
  unit: "",
});

export { PROPOSAL_LIMITS as L };
