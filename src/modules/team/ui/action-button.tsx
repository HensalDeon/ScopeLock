"use client";

import { useActionState, useEffect, useState } from "react";
import { IDLE, type FormState } from "@/shared/lib/form-state";
import { announce, focusAfterUpdate } from "@/shared/ui/announce";
import { Button } from "@/shared/ui/button";
import { ShareLink } from "@/shared/ui/share-link";
import { TOUCH } from "@/shared/ui/touch";

type Action = (
  state: FormState<string>,
  data: FormData,
) => Promise<FormState<string>>;

/**
 * One team action (send again, cancel, make admin, remove), with a pending
 * label. A destructive one asks first, in place ("Remove Priya Nair?").
 * The result is read out even when the row goes, and focus moves to
 * `focusId`. A returned link (an invite) can be copied or sent on WhatsApp.
 */
export function ActionButton({
  action,
  fields,
  label,
  pendingLabel,
  ariaLabel,
  variant = "ghost",
  confirm,
  focusId,
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  pendingLabel: string;
  /** Names who it acts on ("Remove Priya Nair"). */
  ariaLabel?: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  /** Ask first: the question, and the button that goes ahead. */
  confirm?: { question: string; yes: string };
  /** Where focus goes after it worked (the row may be gone). */
  focusId?: string;
}) {
  const [state, run, pending] = useActionState(action, IDLE);
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (state.status !== "success") return;
    if (state.message) announce(state.message);
    if (focusId) focusAfterUpdate(focusId);
  }, [state, focusId]);

  const hidden = Object.entries(fields).map(([name, value]) => (
    <input key={name} type="hidden" name={name} value={value} />
  ));
  const error =
    state.status === "error" && state.message ? (
      <p role="alert" className="max-w-72 text-[13px] text-destructive">
        {state.message}
      </p>
    ) : null;
  const link =
    state.status === "success" && state.link ? (
      <div className="grid w-full max-w-sm gap-1.5 text-left">
        <p className="text-[13px] text-muted-foreground">{state.message}</p>
        <ShareLink
          url={state.link}
          phone={null}
          message="Here's your invite to join us on ScopeLock:"
          compact
          primary={false}
          copyLabel="Copy invite link"
          whatsappLabel="Send the invite on WhatsApp"
        />
      </div>
    ) : null;

  if (confirm && asking)
    return (
      <form
        action={run}
        className="grid w-full max-w-sm gap-2 rounded-lg border bg-background p-3 text-left"
      >
        {hidden}
        <p className="text-sm text-pretty">{confirm.question}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            size="sm"
            variant="destructive"
            className={TOUCH}
            disabled={pending}
            autoFocus
          >
            {pending ? pendingLabel : confirm.yes}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={TOUCH}
            onClick={() => setAsking(false)}
          >
            Keep
          </Button>
        </div>
        {error}
      </form>
    );

  return (
    <form
      action={run}
      onSubmit={(e) => {
        if (confirm) {
          e.preventDefault();
          setAsking(true);
        }
      }}
      className="grid justify-items-end gap-1"
    >
      {hidden}
      <Button
        type="submit"
        size="sm"
        variant={variant}
        className={TOUCH}
        disabled={pending}
        aria-label={ariaLabel}
      >
        {pending ? pendingLabel : label}
      </Button>
      {error}
      {link}
    </form>
  );
}
