"use client";

import { useActionState } from "react";
import { IDLE, type FormState } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { acceptInvite } from "../server/session-actions";

/** "Join Asha Designs": accepts the invite and opens the workspace. */
export function AcceptButton({
  token,
  label,
}: {
  token: string;
  label: string;
}) {
  const [state, run, pending] = useActionState<FormState<string>, FormData>(
    acceptInvite,
    IDLE,
  );
  return (
    <form action={run} className="grid gap-2">
      <input type="hidden" name="token" value={token} />
      <Button type="submit" className={TOUCH} disabled={pending}>
        {pending ? "Joining…" : label}
      </Button>
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-pretty text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
