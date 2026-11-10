"use client";

import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";

/**
 * The save row: what saving will change (before it goes live on the public
 * pricing page), Save and Discard, and the outcome right next to them.
 */
export function PlanSaveRow({
  name,
  dirty,
  pending,
  changes,
  invalid,
  error,
  saved,
  onDiscard,
}: {
  name: string;
  dirty: boolean;
  pending: boolean;
  /** What will change, in words; null while a field can't be read. */
  changes: string[] | null;
  /** The last Save found fields to fix. */
  invalid: boolean;
  error: string | null;
  saved: string | null;
  onDiscard: () => void;
}) {
  return (
    <div className="grid gap-4 border-t pt-6">
      {dirty && changes && changes.length > 0 && (
        <div className="grid gap-1.5 rounded-lg border bg-background px-4 py-3">
          <h2 className="text-sm font-semibold">
            Saving will change, on the public pricing page straight away
          </h2>
          <ul className="grid gap-0.5 text-sm tabular-nums">
            {changes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className={TOUCH} disabled={pending || !dirty}>
          {pending ? "Saving…" : `Save ${name.trim() || "plan"}`}
        </Button>
        {dirty && !pending && (
          <Button
            type="button"
            variant="ghost"
            className={TOUCH}
            onClick={onDiscard}
          >
            Discard changes
          </Button>
        )}
        {error ? (
          <p role="alert" className="text-sm text-pretty text-destructive">
            {error}
          </p>
        ) : invalid ? (
          <p role="alert" className="text-sm text-pretty text-destructive">
            Fix the highlighted fields, then save.
          </p>
        ) : (
          <p
            role="status"
            className="text-sm text-pretty text-muted-foreground"
          >
            {!dirty ? (saved ?? "No changes yet") : ""}
          </p>
        )}
      </div>
    </div>
  );
}
