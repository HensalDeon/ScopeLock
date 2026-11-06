"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { IDLE } from "@/shared/lib/form-state";
import {
  focusFirstInvalid,
  useFormValidation,
} from "@/shared/lib/use-form-validation";
import {
  workspaceDetailsSchema,
  type WorkspaceField,
} from "../domain/workspace";
import type { WorkspaceFormState } from "../server/actions";
import type { WorkspaceValues } from "./workspace-fields";

/**
 * Shared state for the onboarding and settings forms: controlled values,
 * live validation with the server's schema, and a manual submit (React's
 * post-action form reset would otherwise clear controlled fields).
 */
export function useWorkspaceForm(
  serverAction: (
    state: WorkspaceFormState,
    data: FormData,
  ) => Promise<WorkspaceFormState>,
  initial: WorkspaceValues,
  { trackChanges = false } = {},
) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(serverAction, IDLE);
  const [, startTransition] = useTransition();
  const [values, setValues] = useState(initial);
  const form = useFormValidation(workspaceDetailsSchema, values, {
    initial: trackChanges ? initial : undefined,
    serverState: state,
  });

  return {
    formRef,
    state,
    pending,
    values,
    form,
    fieldProps: {
      values,
      onChange: (field: WorkspaceField, value: string) => {
        setValues((v) => ({ ...v, [field]: value }));
        form.edited(field);
      },
      onBlur: (field: WorkspaceField) => form.touch(field),
      errorFor: (field: WorkspaceField) => form.errorFor(field),
    },
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!form.markSubmitted()) {
        focusFirstInvalid(formRef.current);
        return;
      }
      const data = new FormData(event.currentTarget);
      startTransition(() => action(data));
    },
  };
}
