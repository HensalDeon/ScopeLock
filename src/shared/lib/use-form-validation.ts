"use client";

import { useCallback, useState } from "react";
import type { z } from "zod";
import type { FieldErrors, FormState } from "./form-state";
import { hasChanges, validate } from "./form-validation";

/**
 * Live form validation with the server's own Zod schema, following
 * "reward early, punish late":
 *
 * - a field isn't flagged while it's first being typed; it's checked when
 *   the person leaves it (`touch`) or tries to submit
 * - once flagged, it re-checks on every keystroke, so the message goes away
 *   the moment the value is right
 *
 * Errors the server returns that the browser didn't catch (rules only the
 * server can check) still show, until that field is edited.
 *
 * `errorFor(path)` returns the message to show, or undefined. Nested rows use
 * dotted paths ("items.0.amount"); pass a stable `touchKey` (e.g. the row's
 * key) so removing a row doesn't move "touched" onto its neighbour.
 */
export function useFormValidation<Values>(
  schema: z.ZodType,
  values: Values,
  options: { initial?: Values; serverState?: FormState<string> } = {},
) {
  const { initial, serverState } = options;
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set());
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  // Adopt field errors from each new server response (adjusting state while
  // rendering, as React recommends, instead of in an effect).
  const [seenState, setSeenState] = useState(serverState);
  if (serverState !== seenState) {
    setSeenState(serverState);
    setServerErrors(
      serverState?.status === "error" ? (serverState.fieldErrors ?? {}) : {},
    );
  }

  const errors: FieldErrors = validate(schema, values);
  const isValid = Object.keys(errors).length === 0;

  const touch = useCallback((key: string) => {
    setTouched((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);

  /** Call from a field's onChange: drops a stale server message for it. */
  const edited = useCallback((path: string) => {
    setServerErrors((prev) => {
      if (!(path in prev)) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  return {
    errors,
    isValid,
    /** The person has tried to submit at least once. */
    submitted,
    /** Something differs from `initial` once cleaned up (edit forms). */
    isDirty: initial === undefined ? true : hasChanges(schema, values, initial),
    errorFor: (path: string, touchKey: string = path): string | undefined =>
      (submitted || touched.has(touchKey) ? errors[path] : undefined) ??
      serverErrors[path],
    touch,
    edited,
    /** Call on submit: from now on every error shows. Returns isValid. */
    markSubmitted: (): boolean => {
      setSubmitted(true);
      return isValid;
    },
  };
}

/** After a failed submit, move focus to the first field showing an error. */
export function focusFirstInvalid(form: HTMLFormElement | null): void {
  // Wait a frame so the error state has rendered.
  requestAnimationFrame(() => {
    form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });
}
