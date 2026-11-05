/** Field errors keyed by field name, or dotted path for nested rows ("items.0.amount"). */
export type FieldErrors<Field extends string = string> = Partial<
  Record<Field, string>
> &
  Record<string, string | undefined>;

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
      fieldErrors?: FieldErrors<Field>;
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

/**
 * First Zod issue per field, ready for `fieldErrors`. Nested fields use dotted
 * paths ("items.0.amount") so a repeated row can show its own message; the
 * top-level key ("items") also gets the first message for its group.
 */
export function fieldErrorsFrom<Field extends string>(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): FieldErrors<Field> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const [top] = issue.path;
    if (typeof top !== "string") continue;
    errors[top] ??= issue.message;
    if (issue.path.length > 1) {
      errors[issue.path.map(String).join(".")] ??= issue.message;
    }
  }
  return errors as FieldErrors<Field>;
}
