"use client";

import { useUnsavedGuard } from "@/shared/ui/use-unsaved-guard";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { FieldGroup } from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { updateWorkspace } from "../server/actions";
import { useWorkspaceForm } from "./use-workspace-form";
import { WorkspaceFields, type WorkspaceValues } from "./workspace-fields";

/** Settings: edit the business details clients see. */
export function BusinessDetailsForm({ initial }: { initial: WorkspaceValues }) {
  const { formRef, state, pending, form, fieldProps, onSubmit } =
    useWorkspaceForm(updateWorkspace, initial, { trackChanges: true });
  useUnsavedGuard(form.isDirty && !pending);

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-6">
        {state.status === "error" && state.message && (
          <FormAlert>{state.message}</FormAlert>
        )}
        <WorkspaceFields {...fieldProps} showCurrency />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            className={TOUCH}
            disabled={pending || !form.isDirty}
          >
            {pending ? "Saving…" : "Save changes"}
          </Button>
          {!pending && !form.isDirty && (
            <p role="status" className="text-sm text-muted-foreground">
              {state.status === "success" ? state.message : "No changes yet"}
            </p>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}
