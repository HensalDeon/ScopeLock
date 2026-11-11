"use client";

import { useActionState, useContext } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import {
  INLINE_PANEL_FOCUS,
  useInlinePanel,
} from "@/shared/ui/use-inline-panel";
import { cancelPlan, switchPlan } from "../server/checkout-actions";
import { Busy, Note } from "./checkout-lock";

/** Switch between paid plans, or cancel to Free, with a confirm step. */
export function ConfirmChange({
  kind,
  planId,
  label,
  pendingLabel,
  explain,
}: {
  kind: "upgrade" | "downgrade" | "cancel";
  planId: string;
  label: string;
  pendingLabel: string;
  /** What will be charged, and when, in words. */
  explain: string;
}) {
  const lock = useContext(Busy);
  const [state, action, pending] = useActionState(
    kind === "cancel" ? cancelPlan : switchPlan,
    IDLE,
  );
  const panel = useInlinePanel();
  if (state.status === "success") return <Note ok>{state.message}</Note>;
  if (!panel.open)
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={TOUCH}
        disabled={lock.busy}
        {...panel.trigger("open")}
      >
        {label}
      </Button>
    );
  return (
    <form
      action={action}
      {...panel.panel(label)}
      className={cn("col-span-full grid gap-3 rounded-lg", INLINE_PANEL_FOCUS)}
    >
      <input type="hidden" name="planId" value={planId} />
      <p className="text-sm text-pretty">{explain}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          size="sm"
          variant={kind === "cancel" ? "outline" : "default"}
          className={TOUCH}
          disabled={pending}
        >
          {pending ? pendingLabel : label}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={TOUCH}
          onClick={panel.close}
        >
          Keep my plan
        </Button>
      </div>
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-pretty text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
