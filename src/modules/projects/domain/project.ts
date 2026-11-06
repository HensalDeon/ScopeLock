import { z } from "zod";
import { currencyField, type CurrencyCode } from "@/shared/lib/currency";
import { minor, type Minor } from "@/shared/lib/money";
import {
  BILLING_MODELS,
  buildMilestones,
  MILESTONE_LIMITS,
  milestoneInputSchema,
  percentTotal,
  UPFRONT_MILESTONE,
  type BillingModel,
  type Milestone,
} from "./billing";
import {
  buildProposal,
  EMPTY_PROPOSAL,
  proposalInputSchema,
  type ProposalContent,
  type TimelineStep,
} from "./proposal";
import {
  SCOPE_LIMITS,
  scopeItemInputSchema,
  scopeTotal,
  type ScopeItem,
} from "./scope";

export const PROJECT_STATUSES = [
  "draft",
  "awaiting_approval",
  "active",
  "completed",
  "archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
  awaiting_approval: "Waiting for approval",
  active: "Scope approved",
  completed: "Completed",
  archived: "Archived",
};

/** The client has approved the baseline (change requests can follow). */
export function isScopeApproved(status: ProjectStatus): boolean {
  return status === "active" || status === "completed";
}

/** The WhatsApp text that goes before the proposal link. */
export function proposalShareMessage(input: {
  clientFirstName: string;
  projectName: string;
  /** Formatted, e.g. "₹80,000". */
  total: string;
}): string {
  return `Hi ${input.clientFirstName}, here's the proposal for ${input.projectName} (${input.total}). You can read it and approve it here:`;
}

/** Only drafts can be edited or deleted; after sending, scope is locked. */
export function isEditable(status: ProjectStatus): boolean {
  return status === "draft";
}

/** The client's latest answer to the sent proposal (summary; the full
 * signed record lives in the approvals module). */
export type ProjectDecision = {
  decision: "approved" | "rejected";
  at: Date;
  name: string;
  email: string;
  comment: string | null;
  approvalId: string;
};

export type ProjectTotals = {
  baseline: Minor;
  approvedChanges: Minor;
  pendingChanges: Minor;
  paid: Minor;
  due: Minor;
};

export type Project = {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  /** Every amount on the project is in this currency. Locked once sent. */
  currency: CurrencyCode;
  status: ProjectStatus;
  billingModel: BillingModel;
  baseline: {
    items: ScopeItem[];
    total: Minor;
    approvedAt: Date | null;
  };
  milestones: Milestone[];
  /** Optional proposal sections (overview, timeline, terms…). */
  proposal: ProposalContent;
  /**
   * False for projects created before proposal sections existed: their
   * proposal has never been saved, so the workspace's default text applies.
   * Once saved (even with sections cleared), the person's choice wins.
   */
  proposalSaved: boolean;
  /** When the proposal was last sent to the client (null: never). */
  sentAt: Date | null;
  lastDecision: ProjectDecision | null;
  /** A client link exists (it may be shown again; see portal). */
  hasPortalLink: boolean;
  /** How many change requests were ever created (CR numbers used). */
  changeCount: number;
  totals: ProjectTotals;
  createdAt: Date;
  updatedAt: Date;
};

export const PROJECT_NAME_MAX_LENGTH = 120;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 2000;

/** Fields of the project form. `items` and `milestones` are JSON strings. */
export const PROJECT_FIELDS = [
  "clientId",
  "currency",
  "name",
  "description",
  "items",
  "billingModel",
  "milestones",
  "proposal",
] as const;
export type ProjectField = (typeof PROJECT_FIELDS)[number];

/** A form field holding JSON (repeated rows), parsed then validated. */
function jsonField<T extends z.ZodType>(schema: T) {
  return z
    .string()
    .transform((raw, ctx) => {
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        ctx.addIssue({
          code: "custom",
          message:
            "Something went wrong reading the form. Refresh and try again.",
        });
        return z.NEVER;
      }
    })
    .pipe(schema);
}

export const projectInputSchema = z
  .object({
    clientId: z
      .string()
      .regex(/^[0-9a-f]{24}$/i, "Choose who this project is for."),
    currency: currencyField,
    name: z
      .string()
      .trim()
      .min(2, "Give the project a name, e.g. Website redesign.")
      .max(
        PROJECT_NAME_MAX_LENGTH,
        `Keep the name under ${PROJECT_NAME_MAX_LENGTH} characters.`,
      ),
    description: z
      .string()
      .trim()
      .max(
        PROJECT_DESCRIPTION_MAX_LENGTH,
        `Keep it under ${PROJECT_DESCRIPTION_MAX_LENGTH} characters.`,
      )
      .transform((value) => value || null),
    items: jsonField(
      z
        .array(scopeItemInputSchema)
        .min(1, "Add at least one deliverable to the scope.")
        .max(
          SCOPE_LIMITS.maxItems,
          `A scope can have up to ${SCOPE_LIMITS.maxItems} lines.`,
        ),
    ),
    billingModel: z.enum(BILLING_MODELS, {
      error: "Choose how the client will pay.",
    }),
    milestones: jsonField(
      z.array(milestoneInputSchema).max(MILESTONE_LIMITS.max),
    ),
    // Optional: older clients (and tests) may not send it.
    proposal: z
      .string()
      .optional()
      .transform((raw) => raw || "{}")
      .pipe(jsonField(proposalInputSchema.partial())),
  })
  .superRefine((input, ctx) => {
    if (input.billingModel !== "milestones") return;
    if (input.milestones.length < MILESTONE_LIMITS.min) {
      ctx.addIssue({
        code: "custom",
        path: ["milestones"],
        message: `Add at least ${MILESTONE_LIMITS.min} payments, or choose full payment upfront.`,
      });
      return;
    }
    const total = percentTotal(input.milestones);
    if (total !== 100) {
      ctx.addIssue({
        code: "custom",
        path: ["milestones"],
        message: `The payments add up to ${total}%. They need to add up to exactly 100%.`,
      });
    }
  });

export type ProjectInput = z.output<typeof projectInputSchema>;

/**
 * What gets stored for a project's scope and billing: ids for every line and
 * milestone (kept when editing), the baseline total, and each milestone's
 * exact share. Upfront billing is one 100% milestone, so payments treat both
 * models the same way later.
 */
export function buildProjectPlan(
  input: Pick<ProjectInput, "items" | "billingModel" | "milestones"> &
    Partial<Pick<ProjectInput, "proposal">>,
  newId: () => string,
): {
  items: ScopeItem[];
  total: Minor;
  milestones: Milestone[];
  proposal: ProposalContent;
} {
  const items: ScopeItem[] = input.items.map((item) => ({
    id: item.id ?? newId(),
    title: item.title,
    description: item.description,
    includes: item.includes,
    amount: item.amount,
  }));
  const total = scopeTotal(items);
  const milestoneInputs =
    input.billingModel === "upfront"
      ? [{ ...UPFRONT_MILESTONE, id: input.milestones[0]?.id }]
      : input.milestones;
  return {
    items,
    total,
    milestones: buildMilestones(total, milestoneInputs, newId),
    proposal: linkTimelineToPayments(
      buildProposal({ ...EMPTY_PROPOSAL, ...input.proposal }, newId),
      input.billingModel === "milestones" ? input.milestones.length : 0,
    ),
  };
}

export function emptyTotals(baseline: Minor): ProjectTotals {
  return {
    baseline,
    approvedChanges: minor(0),
    pendingChanges: minor(0),
    paid: minor(0),
    due: minor(0),
  };
}

/** Keeps a timeline step's payment link only on milestones, and only to a payment that exists. */
function linkTimelineToPayments(
  proposal: ProposalContent,
  paymentCount: number,
): ProposalContent {
  const used = new Set<number>();
  return {
    ...proposal,
    timeline: proposal.timeline.map((step) => {
      const order = step.paymentOrder ?? null;
      const valid =
        step.isMilestone &&
        order !== null &&
        order < paymentCount &&
        !used.has(order);
      if (valid) used.add(order);
      return { ...step, paymentOrder: valid ? order : null };
    }),
  };
}

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
