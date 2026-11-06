import { z } from "zod";
import { linesField } from "@/shared/lib/text-lines";
import { amountField, MAX_LINE_AMOUNT } from "@/shared/lib/amount-field";
import { sum, type Minor } from "@/shared/lib/money";

export { amountField, draftTotal } from "@/shared/lib/amount-field";

/**
 * One deliverable in the agreed scope: "Home page — ₹12,000". Amounts are
 * minor units of the project's currency.
 */
export type ScopeItem = {
  id: string;
  title: string;
  description: string | null;
  /** "What's included" bullet points shown under the line. */
  includes: string[];
  amount: Minor;
};

export const SCOPE_LIMITS = {
  maxItems: 50,
  titleMax: 160,
  descriptionMax: 500,
  /** 1 crore (10 million) per line, in any currency: catches typos. */
  maxItemAmount: MAX_LINE_AMOUNT,
  maxIncludes: 20,
  includeMax: 200,
} as const;

/** A scope line as the form sends it. `id` is kept when editing. */
export const scopeItemInputSchema = z.object({
  id: z.uuid().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Describe the deliverable.")
    .max(
      SCOPE_LIMITS.titleMax,
      `Keep it under ${SCOPE_LIMITS.titleMax} characters.`,
    ),
  description: z
    .string()
    .trim()
    .max(
      SCOPE_LIMITS.descriptionMax,
      `Keep the note under ${SCOPE_LIMITS.descriptionMax} characters.`,
    )
    .optional()
    .transform((value) => value || null),
  includes: z
    .string()
    .optional()
    .transform((value) => value ?? "")
    .pipe(
      linesField({
        maxItems: SCOPE_LIMITS.maxIncludes,
        maxLength: SCOPE_LIMITS.includeMax,
        label: "point",
      }),
    ),
  amount: amountField,
});

export type ScopeItemInput = z.output<typeof scopeItemInputSchema>;

export function scopeTotal(items: readonly Pick<ScopeItem, "amount">[]): Minor {
  return sum(items.map((item) => item.amount));
}
