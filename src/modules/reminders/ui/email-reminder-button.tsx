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
  align = "end",
  look = "button",
}: {
  projectId: string;
  kind: "proposal" | "change" | "payment";
  refId: string;
  /** Why none can go yet ("Emailed today… · next from …"); null: one can. */
  sentLabel: string | null;
  /** Lines up with its row: right in lists, left in the project strip. */
  align?: "start" | "end";
  /**
   * "link": "Send it now" inside the automatic reminder line, which already
   * says when the next one goes; shows nothing while none can go.
   */
  look?: "button" | "link";
}) {
  const [state, action, pending] = useActionState(emailReminder, IDLE);
  const sent = state.status === "success" ? "Emailed just now" : sentLabel;
  if (look === "link") {
    if (state.status === "success")
      return (
        <span role="status" className="text-sm text-muted-foreground">
          Emailed just now
        </span>
      );
    if (sentLabel) return null;
    return (
      <form action={action} className="inline-grid gap-1">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="ref" value={refId} />
        <Button
          type="submit"
          variant="link"
          size="sm"
          disabled={pending}
          className="h-auto px-0 font-medium text-foreground underline max-sm:h-11"
        >
          {pending ? "Emailing…" : "Send it now"}
        </Button>
        {state.status === "error" && state.message && (
          <p role="alert" className="max-w-72 text-[13px] text-destructive">
            {state.message}
          </p>
        )}
      </form>
    );
  }
  if (sent)
    return (
      <p
        role="status"
        className={cn(
          "inline-flex min-h-8 max-w-60 items-start gap-1.5 text-[13px] text-pretty text-muted-foreground",
          align === "end" && "text-right",
        )}
      >
        <Mail aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        {sent}
      </p>
    );
  return (
    <form
      action={action}
      className={cn(
        "grid gap-1",
        align === "end" ? "justify-items-end" : "justify-items-start",
      )}
    >
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
          className={cn(
            "max-w-56 text-[12px] text-destructive",
            align === "end" && "text-right",
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
