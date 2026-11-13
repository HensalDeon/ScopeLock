"use client";

import { useActionState, useEffect } from "react";
import { IDLE, type FormState } from "@/shared/lib/form-state";
import { announce } from "@/shared/ui/announce";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";

type Action = (
  state: FormState<string>,
  data: FormData,
) => Promise<FormState<string>>;

/** One button that runs a team action, with a pending label and its result. */
export function ActionButton({
  action,
  fields,
  label,
  pendingLabel,
  variant = "ghost",
  confirm,
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  /** Asked before running (removing someone, leaving). */
  confirm?: string;
}) {
  const [state, run, pending] = useActionState(action, IDLE);
  // The row may go (removed, cancelled): say what happened anyway.
  useEffect(() => {
    if (state.status === "success" && state.message) announce(state.message);
  }, [state]);
  return (
    <form
      action={run}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className="grid justify-items-end gap-1"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button
        type="submit"
        size="sm"
        variant={variant}
        className={TOUCH}
        disabled={pending}
      >
        {pending ? pendingLabel : label}
      </Button>
      {state.status !== "idle" && state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "max-w-64 text-right text-[13px] text-destructive"
              : "max-w-64 text-right text-[13px] text-muted-foreground"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
