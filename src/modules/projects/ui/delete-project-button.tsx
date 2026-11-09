"use client";

import { useActionState } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import {
  INLINE_PANEL_FOCUS,
  useInlinePanel,
} from "@/shared/ui/use-inline-panel";
import { cn } from "@/shared/lib/utils";
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
  const panel = useInlinePanel();

  if (!panel.open) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        {...panel.trigger("open")}
      >
        Delete draft
      </Button>
    );
  }

  return (
    <form
      action={action}
      {...panel.panel(`Delete ${projectName}`)}
      className={cn("grid gap-3 rounded-lg border p-4", INLINE_PANEL_FOCUS)}
    >
      <input type="hidden" name="id" value={projectId} />
      <p className="text-sm">
        Delete <span className="font-medium">{projectName}</span>? The draft and
        its scope are removed for good.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Deleting…" : "Delete draft"}
        </Button>
        <Button type="button" variant="ghost" onClick={panel.close}>
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
