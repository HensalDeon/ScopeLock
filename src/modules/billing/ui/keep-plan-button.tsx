"use client";

import { useActionState } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { keepPlan } from "../server/checkout-actions";
import { Note } from "./checkout-lock";

/** "Keep Agency": drops a move to a smaller plan before it happens. */
export function KeepPlanButton({ planName }: { planName: string }) {
  const [state, action, pending] = useActionState(keepPlan, IDLE);
  if (state.status === "success") return <Note ok>{state.message}</Note>;
  return (
    <form action={action} className="contents">
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className={TOUCH}
        disabled={pending}
      >
        {pending ? "Saving…" : `Keep ${planName}`}
      </Button>
      {state.status === "error" && state.message && (
        <Note ok={false}>{state.message}</Note>
      )}
    </form>
  );
}
