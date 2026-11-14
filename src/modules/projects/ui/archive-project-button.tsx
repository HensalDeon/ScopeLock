"use client";

import type { Route } from "next";
import Link from "next/link";
import { useActionState } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import {
  INLINE_PANEL_FOCUS,
  useInlinePanel,
} from "@/shared/ui/use-inline-panel";
import type { ArchiveBlocker } from "../domain/archive";
import {
  setProjectArchived,
  type ArchiveFormState,
} from "../server/archive-actions";

const LINK =
  "font-medium underline underline-offset-4 max-sm:inline-flex max-sm:min-h-11 max-sm:items-center";

/**
 * Archive a finished project (with a confirm step, or the reason it can't
 * be archived yet), or restore an archived one. Nothing is deleted.
 */
export function ArchiveProjectButton({
  projectId,
  projectName,
  archived,
  blocker,
  full = null,
}: {
  projectId: string;
  projectName: string;
  archived: boolean;
  /** Why it can't be archived yet (something waits on the client). */
  blocker: ArchiveBlocker | null;
  /** Archived, and the plan has no room to restore it: why. */
  full?: string | null;
}) {
  const [state, action, pending] = useActionState<ArchiveFormState, FormData>(
    setProjectArchived,
    IDLE,
  );
  const panel = useInlinePanel();

  if (!archived && !panel.open) {
    return (
      <Button
        type="button"
        variant="outline"
        className={TOUCH}
        {...panel.trigger("open")}
      >
        Archive project
      </Button>
    );
  }

  if (!archived && blocker) {
    return (
      <div
        {...panel.panel(`Archive ${projectName}`)}
        className={cn("grid gap-3 rounded-lg", INLINE_PANEL_FOCUS)}
      >
        <p className="text-sm text-pretty">
          <span className="font-medium">Not yet.</span> {blocker.reason}{" "}
          {blocker.section && (
            <Link
              href={`#${blocker.section}-${projectId}` as Route}
              className={LINK}
              onClick={panel.close}
            >
              {blocker.section === "changes"
                ? "Go to change requests"
                : "Go to payments"}
            </Link>
          )}
        </p>
        <Button
          type="button"
          variant="ghost"
          className={cn("w-fit", TOUCH)}
          onClick={panel.close}
        >
          Close
        </Button>
      </div>
    );
  }

  return (
    <form
      action={action}
      {...(archived ? {} : panel.panel(`Archive ${projectName}`))}
      className={cn("grid gap-3 rounded-lg", INLINE_PANEL_FOCUS)}
    >
      <input type="hidden" name="id" value={projectId} />
      <input
        type="hidden"
        name="archived"
        value={archived ? "false" : "true"}
      />
      {!archived && (
        <p className="text-sm text-pretty text-muted-foreground">
          It frees a place on your plan and becomes read-only. Nothing is
          deleted: the scope, changes, payments and your client&apos;s link stay
          as they are, and its money still counts in your totals. You can
          restore it any time.
        </p>
      )}
      {archived && full && (
        <p className="text-sm text-pretty text-warning-ink">
          {full}{" "}
          <Link href="/projects" className={LINK}>
            Go to projects
          </Link>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          variant="outline"
          className={TOUCH}
          // Full plan: the line above says why; nothing to try yet.
          disabled={pending || (archived && Boolean(full))}
        >
          {archived
            ? pending
              ? "Restoring…"
              : "Restore project"
            : pending
              ? "Archiving…"
              : "Archive project"}
        </Button>
        {!archived && (
          <Button
            type="button"
            variant="ghost"
            className={TOUCH}
            onClick={panel.close}
          >
            Don&apos;t archive
          </Button>
        )}
      </div>
      {state.status === "error" && state.message && (
        <p role="alert" className="text-sm text-pretty text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
