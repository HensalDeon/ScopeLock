"use client";

import { useActionState } from "react";
import { IDLE, type FormState } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { leaveWorkspace } from "../server/session-actions";

/** A member or admin leaves the workspace (after confirming). */
export function LeaveButton() {
  const [state, run, pending] = useActionState<FormState<string>>(
    () => leaveWorkspace(),
    IDLE,
  );
  return (
    <form
      action={run}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Leave this workspace? You'll need a new invite to come back.",
          )
        )
          e.preventDefault();
      }}
      className="grid justify-items-start gap-2"
    >
      <Button
        type="submit"
        variant="outline"
        className={TOUCH}
        disabled={pending}
      >
        {pending ? "Leaving…" : "Leave this workspace"}
      </Button>
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
