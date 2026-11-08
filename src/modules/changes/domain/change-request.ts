import { z } from "zod";
import { amountField } from "@/shared/lib/amount-field";
import type { CurrencyCode } from "@/shared/lib/currency";
import { sum, type Minor } from "@/shared/lib/money";

/**
 * A change request (CR): extra work after the baseline is approved, with its
 * own price, sent to the client for approval. Approving it is separate from
 * paying for it; `billing` says where the money lands in the schedule.
 */
export const CHANGE_STATUSES = [
  "draft",
  "sent",
  "approved",
  "rejected",
  "withdrawn",
] as const;
export type ChangeStatus = (typeof CHANGE_STATUSES)[number];

export const CHANGE_STATUS_LABELS: Record<ChangeStatus, string> = {
  draft: "Draft",
  sent: "Waiting for approval",
  approved: "Approved",
  rejected: "Declined",
  withdrawn: "Cancelled",
};

export const BILLING_OPTIONS = [
  "final",
  "next_milestone",
  "split",
  "milestone",
  "pay_now",
] as const;
export type BillingOption = (typeof BILLING_OPTIONS)[number];

export type ChangeBilling = {
  option: BillingOption;
  /** Only for "milestone": which payment it's added to. */
  milestoneId: string | null;
};

export const SOURCE_CHANNELS = [
  "whatsapp",
  "call",
  "email",
  "meeting",
  "other",
] as const;
export type SourceChannel = (typeof SOURCE_CHANNELS)[number];

export const SOURCE_LABELS: Record<SourceChannel, string> = {
  whatsapp: "WhatsApp",
  call: "Phone call",
  email: "Email",
  meeting: "Meeting",
  other: "Other",
};

/** One share of a change: on a payment (milestoneId) or due now (null). */
export type Placement = { milestoneId: string | null; amount: Minor };

export type ChangeItem = {
  id: string;
  title: string;
  description: string | null;
  amount: Minor;
};

export type ChangeRequest = {
  id: string;
  projectId: string;
  /** 1, 2, 3… per project; shown as CR-001. */
  number: number;
  title: string;
  description: string | null;
  items: ChangeItem[];
  total: Minor;
  currency: CurrencyCode;
  billing: ChangeBilling;
  /** Where the request came from. Internal: never shown to the client. */
  source: { channel: SourceChannel; note: string | null } | null;
  status: ChangeStatus;
  /** Has it ever been sent? Drafts that were never sent can be deleted. */
  everSent: boolean;
  sentAt: Date | null;
  decision: {
    decision: "approved" | "rejected";
    at: Date;
    name: string;
    email: string;
    comment: string | null;
    approvalId: string;
  } | null;
  /**
   * Where its money went, fixed when the client approved it (null for
   * changes approved before this was recorded: see `placementOf`).
   */
  placement: Placement[] | null;
  createdAt: Date;
  updatedAt: Date;
};

export function changeLabel(number: number): string {
  return `CR-${String(number).padStart(3, "0")}`;
}

/** Parses "CR-001", "cr-1" or "1" from a URL; null if it isn't one. */
export function parseChangeNumber(value: string): number | null {
  const match = /^(?:cr-)?0*(\d{1,6})$/i.exec(value.trim());
  const number = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

// ── Form input ─────────────────────────────────────────────────────────────

export const CHANGE_LIMITS = {
  title: 120,
  description: 2000,
  maxItems: 20,
  itemTitle: 160,
  itemDescription: 300,
  sourceNote: 500,
} as const;

export const CHANGE_FIELDS = [
  "title",
  "description",
  "items",
  "billingOption",
  "milestoneId",
  "sourceChannel",
  "sourceNote",
] as const;
export type ChangeField = (typeof CHANGE_FIELDS)[number];

const optionalText = (max: number, what: string) =>
  z
    .string()
    .trim()
    .max(
      max,
      `Keep the ${what} under ${max.toLocaleString("en-IN")} characters.`,
    )
    .transform((value) => value || null);

export const changeItemInputSchema = z.object({
  id: z.uuid().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Describe the work.")
    .max(
      CHANGE_LIMITS.itemTitle,
      `Keep it under ${CHANGE_LIMITS.itemTitle} characters.`,
    ),
  description: z
    .string()
    .trim()
    .max(
      CHANGE_LIMITS.itemDescription,
      `Keep the note under ${CHANGE_LIMITS.itemDescription} characters.`,
    )
    .optional()
    .transform((value) => value || null),
  amount: amountField,
});

/** Items arrive as JSON from the form's hidden field. */
const itemsField = z
  .string()
  .transform((raw, ctx) => {
    try {
      return JSON.parse(raw || "[]") as unknown;
    } catch {
      ctx.addIssue({ code: "custom", message: "Add at least one line." });
      return z.NEVER;
    }
  })
  .pipe(
    z
      .array(changeItemInputSchema)
      .min(1, "Add at least one line with a price.")
      .max(
        CHANGE_LIMITS.maxItems,
        `Keep it to ${CHANGE_LIMITS.maxItems} lines or fewer.`,
      ),
  );

export const changeInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Give the change a short name, like “Blog section”.")
      .max(
        CHANGE_LIMITS.title,
        `Keep the name under ${CHANGE_LIMITS.title} characters.`,
      ),
    description: optionalText(CHANGE_LIMITS.description, "description"),
    items: itemsField,
    billingOption: z.enum(BILLING_OPTIONS, {
      message: "Choose when this gets paid.",
    }),
    milestoneId: z
      .string()
      .trim()
      .transform((value) => value || null),
    sourceChannel: z
      .union([z.enum(SOURCE_CHANNELS), z.literal("")])
      .transform((value) => value || null),
    sourceNote: optionalText(CHANGE_LIMITS.sourceNote, "note"),
  })
  .refine(
    (input) =>
      input.billingOption !== "milestone" || Boolean(input.milestoneId),
    {
      path: ["milestoneId"],
      message: "Choose which payment to add it to.",
      when: ({ value }) =>
        (value as { billingOption?: unknown } | undefined)?.billingOption ===
        "milestone",
    },
  );

export type ChangeInput = z.output<typeof changeInputSchema>;

export function changeTotal(
  items: readonly Pick<ChangeItem, "amount">[],
): Minor {
  return sum(items.map((item) => item.amount));
}
