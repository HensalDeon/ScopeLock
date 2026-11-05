import type { z } from "zod";
import { fieldErrorsFrom, type FieldErrors } from "./form-state";

/**
 * Pure helpers behind useFormValidation (kept separate so they're unit
 * tested). The browser runs the same Zod schema as the server action, so
 * what the form shows and what the server accepts can't drift apart.
 */

export function validate(schema: z.ZodType, values: unknown): FieldErrors {
  const result = schema.safeParse(values);
  return result.success ? {} : fieldErrorsFrom(result.error.issues);
}

/**
 * Whether the form would save something different from what's stored.
 * Compares the parsed (cleaned) output, so "98765 43210" and
 * "+91 98765 43210", or " Rahul " and "Rahul", count as unchanged.
 * An unparseable value counts as a change: the person did edit something.
 */
export function hasChanges(
  schema: z.ZodType,
  values: unknown,
  initial: unknown,
): boolean {
  const now = schema.safeParse(values);
  const before = schema.safeParse(initial);
  if (!now.success || !before.success) {
    return JSON.stringify(values) !== JSON.stringify(initial);
  }
  return JSON.stringify(now.data) !== JSON.stringify(before.data);
}
