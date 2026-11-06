"use client";

import { useActionState, useLayoutEffect, useState } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import { deleteProject, type ProjectFormState } from "../server/actions";

/** Deletes a draft, after a confirm step. Sent projects can't be deleted. */
export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(
    deleteProject,
    IDLE,
  );
  const [confirming, setConfirming] = useState(false);
  useLayoutEffect(() => () => setConfirming(false), []);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirming(true)}
      >
        Delete draft
      </Button>
    );
  }

  return (
    <form action={action} className="grid gap-3 rounded-lg border p-4">
      <input type="hidden" name="id" value={projectId} />
      <p className="text-sm">
        Delete <span className="font-medium">{projectName}</span>? The draft and
        its scope are removed for good.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Deleting…" : "Delete draft"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setConfirming(false)}
        >
          Keep it
        </Button>
      </div>
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
