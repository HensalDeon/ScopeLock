import type { Route } from "next";
import Link from "next/link";
import { formatDateTime } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";
import type { ActivityLine } from "../domain/activity";

type Quotes = "full" | "clamped" | "hidden";

type Item = {
  id: string;
  at: Date;
  /** Which project, for feeds that mix projects (the overview). */
  context?: { label: string; href: string };
  /** The change request it's about ("CR-002"), linked. */
  link?: { label: string; href: string } | null;
} & ActivityLine;

/** A project's history, newest first. Used in the app and the portal. */
export function ActivityTimeline({
  items,
  empty,
  visible = 8,
  quotes = "full",
}: {
  items: Item[];
  /** Shown when there's nothing yet. */
  empty: string;
  /** Latest events shown; older ones fold under "Show earlier activity". */
  visible?: number;
  /**
   * The client's quoted notes: in full (default), clamped to two lines
   * (summaries) or hidden (the overview's one-line feed).
   */
  quotes?: Quotes;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  const latest = items.slice(0, visible);
  const earlier = items.slice(visible);
  return (
    <div className="grid">
      <Lines items={latest} last={earlier.length === 0} quotes={quotes} />
      {earlier.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none pl-7 text-sm font-medium underline-offset-4 group-open:mb-3 hover:underline [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">
              Show {earlier.length} earlier{" "}
              {earlier.length === 1 ? "event" : "events"}
            </span>
            <span className="hidden group-open:inline">
              Hide earlier events
            </span>
          </summary>
          <Lines items={earlier} last quotes={quotes} />
        </details>
      )}
    </div>
  );
}

function Lines({
  items,
  last,
  quotes,
}: {
  items: Item[];
  last: boolean;
  quotes: Quotes;
}) {
  return (
    <ol className="grid">
      {items.map((item, i) => (
        <li key={item.id} className="grid grid-cols-[1rem_minmax(0,1fr)] gap-3">
          <div className="relative flex justify-center">
            <span
              aria-hidden
              className={cn(
                "relative z-10 mt-1.5 size-2 rounded-full",
                // History is past events: emerald marks something settled
                // (approved, received); nothing here is still waiting, so no
                // amber (that's for live badges).
                item.tone === "done" ? "bg-brand" : "bg-muted-foreground/40",
              )}
            />
            {(i < items.length - 1 || !last) && (
              <span
                aria-hidden
                className="absolute top-4 bottom-0 w-px bg-border"
              />
            )}
          </div>
          <div className="grid gap-1 pb-5 text-sm">
            <p className="leading-snug text-pretty">{item.text}</p>
            {item.quote && quotes !== "hidden" && (
              <p
                className={cn(
                  "border-l-2 border-border pl-3 leading-relaxed whitespace-pre-line text-muted-foreground",
                  quotes === "clamped" && "line-clamp-2",
                )}
              >
                “{item.quote}”
              </p>
            )}
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatDateTime(item.at)}
              {item.link && (
                <>
                  {" · "}
                  <Link
                    href={item.link.href as Route}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {item.link.label}
                  </Link>
                </>
              )}
              {item.context && (
                <>
                  {" · "}
                  <Link
                    href={item.context.href as Route}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {item.context.label}
                  </Link>
                </>
              )}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
