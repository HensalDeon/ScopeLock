"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";

/**
 * The client's details read-only, with "Edit details" opening the form in
 * place (and "Done" closing it). Most visits are to look, not to edit.
 */
export function ClientDetails({
  view,
  form,
}: {
  view: ReactNode;
  form: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  // Visited pages stay mounted (CONVENTIONS §5): come back to the summary.
  useLayoutEffect(() => () => setEditing(false), []);
  return editing ? (
    <div className="grid gap-4">
      {form}
      <Button
        type="button"
        variant="ghost"
        className={`justify-self-start ${TOUCH}`}
        onClick={() => setEditing(false)}
      >
        Done
      </Button>
    </div>
  ) : (
    <div className="grid gap-4">
      {view}
      <Button
        type="button"
        variant="outline"
        className={`justify-self-start ${TOUCH}`}
        onClick={() => setEditing(true)}
      >
        Edit details
      </Button>
    </div>
  );
}
