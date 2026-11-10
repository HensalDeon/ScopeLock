import { z } from "zod";

/** What was decided on: the project's proposal ("baseline", id = project id)
 * or a change request (id = the CR's id). */
export type ApprovalSubject = {
  type: "baseline" | "change_request";
  id: string;
};

export type Decision = "approved" | "rejected";

/** A signed, insert-only record of a client's decision. */
export type Approval = {
  id: string;
  projectId: string;
  subject: ApprovalSubject;
  decision: Decision;
  decidedBy: { name: string; email: string };
  comment: string | null;
  decidedAt: Date;
  /** SHA-256 of the canonical JSON of exactly what the client saw. */
  snapshotHash: string;
  hashVersion: number;
  ip: string | null;
  userAgent: string | null;
  /** "Proposal" or "CR-001 Blog section", from the snapshot. */
  label: string;
};

export const DECISION_FIELDS = [
  "decision",
  "name",
  "email",
  "comment",
] as const;
export type DecisionField = (typeof DECISION_FIELDS)[number];

export const DECISION_LIMITS = { name: 120, email: 254, comment: 2000 };

/** The client's answer on the portal. Comments are required when asking for
 * changes, so the freelancer knows what to change. */
export const decisionInputSchema = z
  .object({
    decision: z.enum(["approved", "rejected"], {
      message: "Choose to approve or ask for changes.",
    }),
    name: z
      .string()
      .trim()
      .min(2, "Type your full name.")
      .max(
        DECISION_LIMITS.name,
        `Keep your name under ${DECISION_LIMITS.name} characters.`,
      ),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(DECISION_LIMITS.email, "That email address is too long.")
      .pipe(z.email("Enter your email, like rahul@company.com.")),
    comment: z
      .string()
      .trim()
      .max(
        DECISION_LIMITS.comment,
        `Keep the note under ${DECISION_LIMITS.comment.toLocaleString("en-IN")} characters.`,
      )
      .transform((value) => value || null),
  })
  .refine((input) => input.decision !== "rejected" || Boolean(input.comment), {
    path: ["comment"],
    message: "Add a short note, so they know what to change.",
    // Check it even while other fields (name, email) are still wrong, so
    // every problem shows at once.
    when: ({ value }) => {
      const v = value as { decision?: unknown } | undefined;
      return v?.decision === "rejected";
    },
  });

export type DecisionInput = z.output<typeof decisionInputSchema>;

/** "Approved", or for a "no": "Changes requested" (proposal) / "Declined" (CR). */
export function verdictLabel(
  approval: Pick<Approval, "decision" | "subject">,
): string {
  if (approval.decision === "approved") return "Approved";
  return approval.subject.type === "baseline"
    ? "Changes requested"
    : "Declined";
}

/**
 * The answer as the document prints it (who, when, and that the record still
 * matches its fingerprint), so a saved PDF carries the signature.
 */
export function acceptanceOf(
  approval: Pick<
    Approval,
    | "decision"
    | "subject"
    | "decidedBy"
    | "decidedAt"
    | "snapshotHash"
    | "comment"
  > & { intact: boolean },
  checkedAt: Date,
): {
  verdict: string;
  name: string;
  email: string;
  at: Date;
  comment: string | null;
  record: { hash: string; intact: boolean; checkedAt: Date };
} {
  return {
    verdict: verdictLabel(approval),
    name: approval.decidedBy.name,
    email: approval.decidedBy.email,
    at: approval.decidedAt,
    comment: approval.comment ?? null,
    record: { hash: approval.snapshotHash, intact: approval.intact, checkedAt },
  };
}
