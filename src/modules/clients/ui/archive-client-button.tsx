"use client";

import { useActionState, useLayoutEffect, useState } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
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
  const [confirming, setConfirming] = useState(false);

  // Visited pages stay alive (CONVENTIONS §5): don't come back mid-confirm.
  useLayoutEffect(() => () => setConfirming(false), []);

  if (!archived && !confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setConfirming(true)}
      >
        Archive client
      </Button>
    );
  }

  return (
    <form action={action} className="grid gap-3">
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
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirming(false)}
          >
            Keep
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
