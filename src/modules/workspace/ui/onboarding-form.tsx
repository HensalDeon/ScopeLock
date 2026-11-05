"use client";

import { useActionState, useState } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import { FieldGroup } from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { setUpWorkspace, type WorkspaceFormState } from "../server/actions";
import { ClientViewPreview } from "./client-view-preview";
import { WorkspaceFields } from "./workspace-fields";

export function OnboardingForm({ suggestedName }: { suggestedName: string }) {
  const [state, action, pending] = useActionState<WorkspaceFormState, FormData>(
    setUpWorkspace,
    IDLE,
  );
  const [businessName, setBusinessName] = useState(suggestedName);

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
      <form action={action} noValidate>
        <FieldGroup className="gap-6">
          {state.status === "error" && state.message && (
            <FormAlert>{state.message}</FormAlert>
          )}
          <WorkspaceFields
            state={state}
            businessName={businessName}
            onBusinessNameChange={setBusinessName}
            defaults={{}}
          />
          <div>
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Creating workspace…" : "Create workspace"}
            </Button>
          </div>
        </FieldGroup>
      </form>
      <div className="lg:sticky lg:top-10">
        <ClientViewPreview businessName={businessName} />
      </div>
    </div>
  );
}
