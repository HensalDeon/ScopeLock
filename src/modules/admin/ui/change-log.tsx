import type { Route } from "next";
import Link from "next/link";
import { formatDateTime } from "@/shared/lib/dates";

export type ChangeLogEntry = {
  id: string;
  at: Date;
  by: string;
  target: string;
  href?: string;
  changes: string[];
};

/**
 * Admin: what was changed, by whom and when (newest first). Read-only: the
 * log can't be edited or deleted.
 */
export function ChangeLog({ entries }: { entries: ChangeLogEntry[] }) {
  return (
    <ol className="divide-y rounded-xl border bg-background">
      {entries.map((e) => (
        <li key={e.id} className="grid gap-1.5 px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <h3 className="text-sm font-semibold">
              {e.href ? (
                <Link
                  href={e.href as Route}
                  className="underline-offset-4 hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
                >
                  {e.target}
                </Link>
              ) : (
                e.target
              )}
            </h3>
            <span className="text-[12px] text-muted-foreground tabular-nums">
              {formatDateTime(e.at)}
            </span>
          </div>
          <ul className="grid gap-0.5 text-sm">
            {e.changes.map((c) => (
              <li key={c} className="tabular-nums">
                {c}
              </li>
            ))}
          </ul>
          <p className="truncate text-[12px] text-muted-foreground">
            By {e.by}
          </p>
        </li>
      ))}
    </ol>
  );
}
