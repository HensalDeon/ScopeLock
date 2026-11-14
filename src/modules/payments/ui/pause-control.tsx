"use client";

import { useActionState, useId, useState } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { announcing } from "@/shared/ui/announce";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { TOUCH } from "@/shared/ui/touch";
import { setPaymentAutoReminders } from "../server/reminder-actions";

const INLINE =
  "h-auto px-0 font-medium text-foreground underline max-sm:h-11 max-sm:px-0";

/**
 * "Pause" on the automatic reminder line: until a day (a client's "I'll pay
 * on Friday"), after which reminders carry on by themselves, or with no end
 * date. Opens in place; focus stays on the line.
 */
export function PauseControl({
  projectId,
  paymentId,
  clientName,
  minDate,
  maxDate,
  focusId,
}: {
  projectId: string;
  paymentId: string;
  clientName: string;
  /** Date input bounds ("2026-11-14"): tomorrow to 60 days ahead. */
  minDate: string;
  maxDate: string;
  /** The reminder line, which shows the result. */
  focusId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    announcing(setPaymentAutoReminders, focusId),
    IDLE,
  );
  const id = useId();
  const error = state.status === "error" ? state.message : null;

  if (!open)
    return (
      <Button
        type="button"
        variant="link"
        size="sm"
        className={INLINE}
        aria-expanded={false}
        onClick={() => setOpen(true)}
      >
        Pause
      </Button>
    );

  return (
    <form
      action={action}
      className="grid w-full gap-2 rounded-lg border bg-background p-3 text-foreground sm:max-w-md"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="paymentId" value={paymentId} />
      <input type="hidden" name="paused" value="true" />
      <label htmlFor={id} className="text-sm font-medium">
        Pause until (optional)
      </label>
      <p className="-mt-1 text-sm text-pretty text-muted-foreground">
        When {clientName} has said when they&apos;ll pay. Reminders start again
        that day.
      </p>
      <Input
        id={id}
        type="date"
        name="until"
        min={minDate}
        max={maxDate}
        className="w-fit"
        aria-invalid={error ? true : undefined}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className={TOUCH}
          disabled={pending}
        >
          {pending ? "Pausing…" : "Pause reminders"}
        </Button>
        <Button
          type="button"
          variant="link"
          size="sm"
          className={INLINE}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
