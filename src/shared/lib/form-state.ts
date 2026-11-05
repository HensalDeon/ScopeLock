/**
 * The result a form's server action returns to `useActionState`.
 * Client-safe: imported by forms and by the actions that produce it.
 */
export type FormState<Field extends string = string> =
  | { status: "idle" }
  | {
      status: "error";
      /** Form-level message, shown above the fields. */
      message?: string;
      fieldErrors?: Partial<Record<Field, string>>;
      /** What was typed, echoed back so the form doesn't clear on error. */
      values?: Partial<Record<Field, string>>;
    }
  | {
      status: "success";
      message?: string;
      values?: Partial<Record<Field, string>>;
      /** Id of a created record, when the caller needs to link to it. */
      id?: string;
    };

export const IDLE: FormState<never> = { status: "idle" };

/**
 * An expected failure whose message is safe and useful to show the person
 * ("A client with this email already exists"). Anything else thrown inside an
 * action is logged and replaced with a generic message.
 */
export class UserError extends Error {
  override readonly name = "UserError";
}

/** Reads the named text fields from a form. Files and unknown keys are ignored. */
export function readFields<Field extends string>(
  formData: FormData,
  fields: readonly Field[],
): Record<Field, string> {
  const values = {} as Record<Field, string>;
  for (const field of fields) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }
  return values;
}

/** First Zod issue per top-level field, ready for `fieldErrors`. */
export function fieldErrorsFrom<Field extends string>(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    errors[key as Field] ??= issue.message;
  }
  return errors;
}
