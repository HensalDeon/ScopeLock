"use client";

import { useActionState } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { announcing } from "@/shared/ui/announce";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import type { PaymentFormState } from "../server/actions";

type Action = (s: PaymentFormState, d: FormData) => Promise<PaymentFormState>;

/** One button that runs an action, with a pending label and its error. */
export function Run({
  action: run,
  fields,
  label,
  pendingLabel,
  variant = "default",
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
}) {
  // On success the row moves on and this button is gone: say what happened
  // and put focus on the money strip, which now shows the new state.
  const [state, action, pending] = useActionState<PaymentFormState, FormData>(
    announcing(run, `money-${fields.projectId}`),
    IDLE,
  );
  return (
    <form action={action} className="grid gap-1.5">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button
        type="submit"
        size="sm"
        className={TOUCH}
        variant={variant}
        disabled={pending}
      >
        {pending ? pendingLabel : label}
      </Button>
      {state.status === "error" && (state.message || state.fieldErrors) && (
        <p role="alert" className="text-sm text-destructive">
          {state.message ?? Object.values(state.fieldErrors ?? {})[0]}
        </p>
      )}
    </form>
  );
}
