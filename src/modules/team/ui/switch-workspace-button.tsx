"use client";

import { useActionState } from "react";
import { IDLE, type FormState } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { switchWorkspace } from "../server/session-actions";

/** Opens another workspace this person belongs to. */
export function SwitchWorkspaceButton({
  workspaceId,
  label,
}: {
  workspaceId: string;
  label: string;
}) {
  const [state, run, pending] = useActionState<FormState<string>, FormData>(
    switchWorkspace,
    IDLE,
  );
  return (
    <form action={run} className="grid gap-1">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <Button
        type="submit"
        variant="outline"
        className={TOUCH}
        disabled={pending}
      >
        {pending ? "Opening…" : label}
      </Button>
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
