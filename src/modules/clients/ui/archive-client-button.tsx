"use client";

import { useActionState } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import {
  INLINE_PANEL_FOCUS,
  useInlinePanel,
} from "@/shared/ui/use-inline-panel";
import { cn } from "@/shared/lib/utils";
import { setClientArchived, type ClientFormState } from "../server/actions";

/**
 * Archive (with a confirm step) or restore a client. Archiving never deletes:
 * projects, approvals and payments keep pointing at the client.
 */
export function ArchiveClientButton({
  clientId,
  archived,
  clientName,
}: {
  clientId: string;
  archived: boolean;
  clientName: string;
}) {
  const [state, action, pending] = useActionState<ClientFormState, FormData>(
    setClientArchived,
    IDLE,
  );
  const panel = useInlinePanel();

  if (!archived && !panel.open) {
    return (
      <Button type="button" variant="outline" {...panel.trigger("open")}>
        Archive client
      </Button>
    );
  }

  return (
    <form
      action={action}
      {...(archived ? {} : panel.panel(`Archive ${clientName}`))}
      className={cn("grid gap-3 rounded-lg", INLINE_PANEL_FOCUS)}
    >
      <input type="hidden" name="id" value={clientId} />
      <input
        type="hidden"
        name="archived"
        value={archived ? "false" : "true"}
      />
      {!archived && (
        <p className="text-sm text-muted-foreground">
          {clientName} will be hidden from your client list and the project
          picker. Their projects and approvals stay as they are, and you can
          restore them any time.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="outline" disabled={pending}>
          {archived
            ? pending
              ? "Restoring…"
              : "Restore client"
            : pending
              ? "Archiving…"
              : `Archive ${clientName}`}
        </Button>
        {!archived && (
          <Button type="button" variant="ghost" onClick={panel.close}>
            Don&apos;t archive
          </Button>
        )}
      </div>
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
