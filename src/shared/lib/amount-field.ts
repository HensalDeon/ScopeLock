import { z } from "zod";
import { minor, parseAmount, sum, type Minor } from "./money";

/** 1 crore (10 million) per line, in any currency: catches typos. */
export const MAX_LINE_AMOUNT = minor(1_00_00_000 * 100);

/** An amount as typed ("12,000", "1499.50") → minor units, with a person-friendly error. */
export const amountField = z.string().transform((raw, ctx) => {
  const value = raw.trim();
  if (!value) {
    ctx.addIssue({ code: "custom", message: "Enter an amount." });
    return z.NEVER;
  }
  let amount: Minor;
  try {
    amount = parseAmount(value);
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
      message: "The amount must be more than 0.",
    });
    return z.NEVER;
  }
  if (amount > MAX_LINE_AMOUNT) {
    ctx.addIssue({
      code: "custom",
      message: "Keep each line under 1,00,00,000.",
    });
    return z.NEVER;
  }
  return amount;
});

/**
 * Live total for the form while typing: lines that don't parse yet count as
 * zero, so the number updates without throwing on half-typed input.
 */
export function draftTotal(amounts: readonly string[]): Minor {
  return sum(
    amounts.map((raw) => {
      try {
        const value = parseAmount(raw);
        return value > 0 ? value : minor(0);
      } catch {
        return minor(0);
      }
    }),
  );
}
