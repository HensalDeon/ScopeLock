import { joinLines } from "@/shared/lib/text-lines";
import { toMajor } from "@/shared/lib/money";
import type { ProposalContent } from "../domain/proposal";
import type { ProposalFormValue, ProposalSectionId } from "./proposal-sections";

type WithoutKeys<T> = T extends { key: string } ? Omit<T, "key"> : T;

/** The proposal part of the project form's starting values (no row keys yet). */
export type ProposalFormDefaults = Omit<
  ProposalFormValue,
  "highlights" | "timeline" | "addons"
> & {
  highlights: WithoutKeys<ProposalFormValue["highlights"][number]>[];
  timeline: WithoutKeys<ProposalFormValue["timeline"][number]>[];
  addons: WithoutKeys<ProposalFormValue["addons"][number]>[];
};

/** Saved proposal → form values; sections with content start switched on. */
export function proposalFormDefaults(p: ProposalContent): ProposalFormDefaults {
  const active: ProposalSectionId[] = [];
  if (p.title || p.subtitle) active.push("heading");
  if (p.overview || p.callout) active.push("overview");
  if (p.highlights.length) active.push("highlights");
  if (p.timeline.length) active.push("timeline");
  if (p.addons.length) active.push("addons");
  if (p.clientProvides.length) active.push("clientProvides");
  if (p.exclusions.length) active.push("exclusions");
  if (p.terms.length) active.push("terms");
  if (p.validUntil) active.push("validUntil");
  return {
    active,
    title: p.title ?? "",
    subtitle: p.subtitle ?? "",
    overview: p.overview ?? "",
    callout: p.callout ?? "",
    highlights: p.highlights.map((h) => ({ value: h.value, label: h.label })),
    timeline: p.timeline.map((s) => ({
      id: s.id,
      phase: s.phase,
      duration: s.duration ?? "",
      description: s.description ?? "",
      isMilestone: s.isMilestone,
      paymentOrder: s.paymentOrder == null ? "" : String(s.paymentOrder),
    })),
    addons: p.addons.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description ?? "",
      amount: String(toMajor(a.amount)),
      unit: a.unit ?? "",
    })),
    clientProvides: joinLines(p.clientProvides),
    exclusions: joinLines(p.exclusions),
    terms: joinLines(p.terms),
    validUntil: p.validUntil ?? "",
  };
}

/** Today + n days as yyyy-mm-dd, in India time. */
export function indiaDatePlusDays(days: number, now = new Date()): string {
  const shifted = new Date(now.getTime() + days * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(shifted);
}
