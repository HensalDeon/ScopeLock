import { type TimelineStep } from "./proposal";
import type { Project } from "./project";

export type PaymentTiming = {
  /** The step that unlocks this payment, if any. */
  step: { phase: string; duration: string | null } | null;
  /** "Before work starts", "After Design (Week 2)", or null. */
  dueWhen: string | null;
};

/**
 * For each payment (in schedule order): the timeline step that unlocks it
 * and when it falls due, in words. An unlinked first payment is the
 * advance: "Before work starts".
 */
export function paymentTimings(
  paymentCount: number,
  timeline: readonly Pick<
    TimelineStep,
    "phase" | "duration" | "isMilestone" | "paymentOrder"
  >[],
): PaymentTiming[] {
  return Array.from({ length: paymentCount }, (_, order) => {
    const step = timeline.find(
      (s) => s.isMilestone && (s.paymentOrder ?? null) === order,
    );
    if (step) {
      return {
        step: { phase: step.phase, duration: step.duration },
        dueWhen: `After ${step.phase}${step.duration ? ` (${step.duration})` : ""}`,
      };
    }
    return { step: null, dueWhen: order === 0 ? "Before work starts" : null };
  });
}

/** Payment (milestone id) → the timeline step that unlocks it, by name. */
export function unlockingSteps(
  project: Pick<Project, "milestones" | "proposal">,
): Record<string, string> {
  const ordered = [...project.milestones].sort((a, b) => a.order - b.order);
  const timings = paymentTimings(ordered.length, project.proposal.timeline);
  return Object.fromEntries(
    ordered.flatMap((m, i) => {
      const step = timings[i]?.step;
      return step ? [[m.id, step.phase]] : [];
    }),
  );
}
