"use client";

import { Button } from "@/shared/ui/button";
import { FieldGroup } from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { setUpWorkspace } from "../server/actions";
import { ClientViewPreview } from "./client-view-preview";
import { useWorkspaceForm } from "./use-workspace-form";
import { WorkspaceFields } from "./workspace-fields";

export function OnboardingForm({ suggestedName }: { suggestedName: string }) {
  const { formRef, state, pending, values, fieldProps, onSubmit } =
    useWorkspaceForm(setUpWorkspace, {
      businessName: suggestedName,
      businessType: "",
      phone: "",
      currency: "",
    });

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
      <form ref={formRef} onSubmit={onSubmit} noValidate>
        <FieldGroup className="gap-6">
          {state.status === "error" && state.message && (
            <FormAlert>{state.message}</FormAlert>
          )}
          <WorkspaceFields {...fieldProps} />
          <div>
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Creating workspace…" : "Create workspace"}
            </Button>
          </div>
        </FieldGroup>
      </form>
      {/* Beside the form on wide screens; on phones it would only show up
          after the button, so it's left out there. */}
      <div className="hidden lg:sticky lg:top-10 lg:block">
        <ClientViewPreview
          businessName={values.businessName}
          phone={values.phone}
        />
      </div>
    </div>
  );
}
