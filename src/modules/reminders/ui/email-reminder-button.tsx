"use client";

import { Mail } from "lucide-react";
import { useActionState } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { emailReminder } from "../server/actions";

/**
 * "Email reminder" beside the WhatsApp one: emails the client their link.
 * After one goes (or if one went in the last day) it says so instead.
 */
export function EmailReminderButton({
  projectId,
  kind,
  refId,
  sentLabel,
}: {
  projectId: string;
  kind: "proposal" | "change" | "payment";
  refId: string;
  /** "Emailed 3 hours ago": one went in the last day. */
  sentLabel: string | null;
}) {
  const [state, action, pending] = useActionState(emailReminder, IDLE);
  const sent = state.status === "success" ? "Emailed just now" : sentLabel;
  if (sent)
    return (
      <p className="inline-flex min-h-8 items-center gap-1.5 text-[13px] text-muted-foreground">
        <Mail aria-hidden className="size-3.5" />
        {sent}
      </p>
    );
  return (
    <form action={action} className="grid justify-items-end gap-1">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="ref" value={refId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        className={cn(TOUCH)}
      >
        <Mail aria-hidden />
        {pending ? "Emailing…" : "Email reminder"}
      </Button>
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="max-w-56 text-right text-[12px] text-destructive"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
