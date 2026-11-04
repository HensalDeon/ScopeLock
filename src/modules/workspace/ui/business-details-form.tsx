"use client";

import { useActionState, useState } from "react";
import { Button } from "@/shared/ui/button";
import { FieldGroup } from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import type { BusinessType } from "../domain/workspace";
import { updateWorkspace, type WorkspaceFormState } from "../server/actions";
import { WorkspaceFields } from "./workspace-fields";

export function BusinessDetailsForm({
  initial,
}: {
  initial: { businessName: string; businessType: BusinessType; phone: string };
}) {
  const [state, action, pending] = useActionState<WorkspaceFormState, FormData>(
    updateWorkspace,
    { status: "idle" },
  );
  const [businessName, setBusinessName] = useState(initial.businessName);

  return (
    <form action={action} noValidate>
      <FieldGroup className="gap-6">
        {state.status === "error" && state.message && (
          <FormAlert>{state.message}</FormAlert>
        )}
        <WorkspaceFields
          state={state}
          businessName={businessName}
          onBusinessNameChange={setBusinessName}
          defaults={{
            businessType: initial.businessType,
            phone: initial.phone,
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          {state.status === "saved" && !pending && (
            <p role="status" className="text-sm text-muted-foreground">
              {state.message}
            </p>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}
