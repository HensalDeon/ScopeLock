/**
 * Archiving a project: it stops counting towards the plan's active-project
 * limit and becomes read-only (the client's link still opens). Only once
 * nothing is waiting on the client, so no answer or payment can arrive on a
 * project nobody is watching.
 */
import type { Project } from "./project";

export const ARCHIVED_READ_ONLY =
  "This project is archived. Restore it to make changes.";

export type ArchiveBlocker = {
  reason: string;
  /** The project page section to fix it in (the proposal's card is up top). */
  section: "changes" | "payments" | null;
};

/** Why the project can't be archived yet, or null if it can. */
export function archiveBlocker(
  project: Pick<Project, "status" | "totals">,
  clientFirstName: string,
): ArchiveBlocker | null {
  if (project.status === "awaiting_approval")
    return {
      reason: `The proposal is waiting for ${clientFirstName}'s answer. Withdraw it to edit, or archive once they answer.`,
      section: null,
    };
  if (project.totals.pendingChanges > 0)
    return {
      reason: `A change request is waiting for ${clientFirstName}'s answer. Take it back to edit, or archive once they answer.`,
      section: "changes",
    };
  if (project.totals.due > 0)
    return {
      reason: `A payment you asked ${clientFirstName} for isn't settled yet. Confirm received, or cancel the request, first.`,
      section: "payments",
    };
  return null;
}

/** Room for one more active project on the plan? Null if yes, else why not. */
export function projectLimitReached(input: {
  active: number;
  limit: number;
  planName: string;
  /** What the person is trying to do. */
  to?: "start a new one" | "restore this one";
}): string | null {
  if (input.active < input.limit) return null;
  const to = input.to ?? "start a new one";
  return `You have ${input.active} active project${input.active === 1 ? "" : "s"}, and ${input.planName} allows ${input.limit}. Archive a finished project to ${to}.`;
}

export type ArchivableState =
  | { kind: "paid" }
  | { kind: "draft" }
  /** Approved work not asked for yet (before GST). */
  | { kind: "to_ask"; amount: number };

/**
 * For the "can be archived now" list: what archiving would leave behind,
 * so nobody hides money they haven't asked for without seeing it.
 */
export function archivableState(
  project: Pick<Project, "status" | "totals">,
): ArchivableState {
  if (project.status === "draft") return { kind: "draft" };
  const { baseline, approvedChanges, paid, due } = project.totals;
  const toAsk = baseline + approvedChanges - paid - due;
  return toAsk > 0 ? { kind: "to_ask", amount: toAsk } : { kind: "paid" };
}
