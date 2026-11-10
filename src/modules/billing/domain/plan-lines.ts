/**
 * The pricing page's lines under a plan are free text, so they can drift
 * from the plan itself ("6 active projects" after the limit went to 8, a
 * line for a feature that's switched off, "soon" on something now built).
 * These checks name each drift so the admin form can flag it on the line.
 */
import { FEATURE_LABELS, PLAN_FEATURES, type PlanFeature } from "./plans";

/** Words that tie a line to a feature. */
const FEATURE_WORDS: Record<PlanFeature, RegExp> = {
  brandedClientPages: /\b(logo|branding)\b/i,
  automaticReminders: /\bautomatic\b.*\breminders?\b/i,
  recoveredReports: /\brevenue recovered reports?\b/i,
  prioritySupport: /\bpriority support\b/i,
};

/** The feature a line is about, if any. */
export function lineFeature(label: string): PlanFeature | undefined {
  return PLAN_FEATURES.find((f) => FEATURE_WORDS[f].test(label));
}

type Plan = {
  activeProjects: number;
  teamMembers: number;
  features: Record<PlanFeature, boolean>;
};

const limitIn = (label: string, noun: RegExp): number | undefined => {
  const m = label.match(new RegExp(String.raw`(\d+)\s+${noun.source}`, "i"));
  return m ? Number(m[1]) : undefined;
};

/** A line that states a limit ("6 active projects", "Up to 5 team members"). */
export function statesLimit(label: string): boolean {
  return (
    limitIn(label, /active projects?\b/) !== undefined ||
    limitIn(label, /team members?\b/) !== undefined
  );
}

/** What's wrong with one line, in words, or null. */
export function lineIssue(
  line: { label: string; soon: boolean },
  plan: Plan,
): string | null {
  const projects = limitIn(line.label, /active projects?\b/);
  if (projects !== undefined && projects !== plan.activeProjects)
    return `Says ${projects} active projects; the limit is ${plan.activeProjects}.`;
  const members = limitIn(line.label, /team members?\b/);
  if (members !== undefined && members !== plan.teamMembers)
    return `Says ${members} team members; the limit is ${plan.teamMembers}.`;
  const feature = lineFeature(line.label);
  if (!feature) return null;
  const { title, built } = FEATURE_LABELS[feature];
  if (!plan.features[feature]) return `${title} is switched off for this plan.`;
  if (!built && !line.soon) return `${title} isn't built yet: mark it soon.`;
  if (built && line.soon) return `${title} is built: turn off soon.`;
  return null;
}
