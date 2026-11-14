"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { IDLE, type FormState } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { leaveWorkspace } from "../server/session-actions";

/** A member or admin leaves the workspace, after saying so in place. */
export function LeaveButton({
  quiet = false,
}: {
  /** Red text, not a filled button (when it isn't the page's main action). */
  quiet?: boolean;
}) {
  const [state, run, pending] = useActionState<FormState<string>>(
    () => leaveWorkspace(),
    IDLE,
  );
  const [asking, setAsking] = useState(false);
  const qid = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const reopen = useRef(false);
  useEffect(() => {
    if (!asking && reopen.current) {
      reopen.current = false;
      trigger.current?.focus();
    }
  }, [asking]);
  const close = () => {
    reopen.current = true;
    setAsking(false);
  };
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
          variant={quiet ? "ghost" : "destructive"}
          className={
            quiet
              ? `${TOUCH} px-0 text-destructive hover:bg-transparent hover:underline`
              : TOUCH
          }
          onClick={() => setAsking(true)}
          ref={trigger}
        >
          Leave this workspace
        </Button>
        {error}
      </div>
    );
  return (
    <form
      action={run}
      role="group"
      aria-labelledby={qid}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
      className="grid max-w-md gap-3 rounded-lg bg-canvas p-4"
    >
      <p id={qid} className="text-sm text-pretty">
        Leave this workspace? You&apos;ll need a new invite to come back.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          variant="destructive"
          className={TOUCH}
          disabled={pending}
        >
          {pending ? "Leaving…" : "Leave"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className={TOUCH}
          onClick={close}
          autoFocus
        >
          Stay
        </Button>
      </div>
      {error}
    </form>
  );
}
