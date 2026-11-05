import { z } from "zod";
import { linesField } from "@/shared/lib/text-lines";
import {
  formatINR,
  paise,
  rupeesToPaise,
  sum,
  type Paise,
} from "@/shared/lib/money";

/** One deliverable in the agreed scope: "Home page — ₹12,000". */
export type ScopeItem = {
  id: string;
  title: string;
  description: string | null;
  /** "What's included" bullet points shown under the line. */
  includes: string[];
  amount: Paise;
};

export const SCOPE_LIMITS = {
  maxItems: 50,
  titleMax: 160,
  descriptionMax: 500,
  /** ₹1 crore per line is far above any real deliverable, and catches typos. */
  maxItemAmount: paise(1_00_00_000 * 100),
  maxIncludes: 20,
  includeMax: 200,
} as const;

/** Rupees as typed ("12,000", "1499.50") → paise, with a person-friendly error. */
export const rupeeAmountField = z.string().transform((raw, ctx) => {
  const value = raw.trim();
  if (!value) {
    ctx.addIssue({ code: "custom", message: "Enter an amount." });
    return z.NEVER;
  }
  let amount: Paise;
  try {
    amount = rupeesToPaise(value);
  } catch {
    ctx.addIssue({
      code: "custom",
      message: "Use numbers only, like 12000 or 12,000.50.",
    });
    return z.NEVER;
  }
  if (amount <= 0) {
    ctx.addIssue({
      code: "custom",
      message: "The amount must be more than ₹0.",
    });
    return z.NEVER;
  }
  if (amount > SCOPE_LIMITS.maxItemAmount) {
    ctx.addIssue({
      code: "custom",
      message: `Keep each line under ${formatINR(SCOPE_LIMITS.maxItemAmount)}.`,
    });
    return z.NEVER;
  }
  return amount;
});

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
  amount: rupeeAmountField,
});

export type ScopeItemInput = z.output<typeof scopeItemInputSchema>;

export function scopeTotal(items: readonly Pick<ScopeItem, "amount">[]): Paise {
  return sum(items.map((item) => item.amount));
}

/**
 * Live total for the form while typing: lines that don't parse yet count as
 * zero, so the number updates without throwing on half-typed input.
 */
export function draftTotal(amounts: readonly string[]): Paise {
  return sum(
    amounts.map((raw) => {
      try {
        const value = rupeesToPaise(raw);
        return value > 0 ? value : paise(0);
      } catch {
        return paise(0);
      }
    }),
  );
}
