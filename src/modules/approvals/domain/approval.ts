import { z } from "zod";

/** What was decided on. "baseline" = the project's first proposal; change
 * requests join in Phase 4. */
export type ApprovalSubject = { type: "baseline"; id: string };

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
    message: "Say what you'd like changed.",
    // Check it even while other fields (name, email) are still wrong, so
    // every problem shows at once.
    when: ({ value }) => {
      const v = value as { decision?: unknown } | undefined;
      return v?.decision === "rejected";
    },
  });

export type DecisionInput = z.output<typeof decisionInputSchema>;

export const DECISION_LABELS: Record<Decision, string> = {
  approved: "Approved",
  rejected: "Changes requested",
};
