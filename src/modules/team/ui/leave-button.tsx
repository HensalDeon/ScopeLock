"use client";

import { useActionState, useState } from "react";
import { IDLE, type FormState } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { leaveWorkspace } from "../server/session-actions";

/** A member or admin leaves the workspace, after saying so in place. */
export function LeaveButton() {
  const [state, run, pending] = useActionState<FormState<string>>(
    () => leaveWorkspace(),
    IDLE,
  );
  const [asking, setAsking] = useState(false);
  const error = state.status === "error" && state.message && (
    <p role="alert" className="text-sm text-destructive">
      {state.message}
    </p>
  );
  if (!asking)
    return (
      <div className="grid justify-items-start gap-2">
        <Button
          type="button"
          variant="destructive"
          className={TOUCH}
          onClick={() => setAsking(true)}
        >
          Leave this workspace
        </Button>
        {error}
      </div>
    );
  return (
    <form
      action={run}
      className="grid max-w-md gap-3 rounded-lg border bg-background p-4"
    >
      <p className="text-sm text-pretty">
        Leave this workspace? You&apos;ll need a new invite to come back.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          variant="destructive"
          className={TOUCH}
          disabled={pending}
          autoFocus
        >
          {pending ? "Leaving…" : "Leave"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={TOUCH}
          onClick={() => setAsking(false)}
        >
          Stay
        </Button>
      </div>
      {error}
    </form>
  );
}
