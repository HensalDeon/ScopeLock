import { z } from "zod";
import { currencyField } from "@/shared/lib/currency";
import { type Minor } from "@/shared/lib/money";
import {
  BILLING_MODELS,
  buildMilestones,
  MILESTONE_LIMITS,
  milestoneInputSchema,
  percentTotal,
  UPFRONT_MILESTONE,
  type Milestone,
} from "./billing";
import {
  buildProposal,
  EMPTY_PROPOSAL,
  proposalInputSchema,
  type ProposalContent,
} from "./proposal";
import {
  SCOPE_LIMITS,
  scopeItemInputSchema,
  scopeTotal,
  type ScopeItem,
} from "./scope";

/** The project form: what's typed, checked, and turned into a stored plan. */

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
