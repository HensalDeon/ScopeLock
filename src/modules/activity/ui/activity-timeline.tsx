import { formatDateTime } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";
import type { ActivityLine } from "../domain/activity";

type Item = { id: string; at: Date } & ActivityLine;

/** A project's history, newest first. Used in the app and the portal. */
export function ActivityTimeline({
  items,
  empty,
  visible = 8,
}: {
  items: Item[];
  /** Shown when there's nothing yet. */
  empty: string;
  /** Latest events shown; older ones fold under "Show earlier activity". */
  visible?: number;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  const latest = items.slice(0, visible);
  const earlier = items.slice(visible);
  return (
    <div className="grid">
      <Lines items={latest} last={earlier.length === 0} />
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
          <Lines items={earlier} last />
        </details>
      )}
    </div>
  );
}

function Lines({ items, last }: { items: Item[]; last: boolean }) {
  return (
    <ol className="grid">
      {items.map((item, i) => (
        <li key={item.id} className="grid grid-cols-[1rem_minmax(0,1fr)] gap-3">
          <div className="relative flex justify-center">
            <span
              aria-hidden
              className={cn(
                "relative z-10 mt-1.5 size-2 rounded-full",
                item.tone === "done" && "bg-brand",
                item.tone === "waiting" && "bg-warning",
                item.tone === "neutral" && "bg-muted-foreground/40",
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
            {item.quote && (
              <p className="border-l-2 border-border pl-3 leading-relaxed whitespace-pre-line text-muted-foreground">
                “{item.quote}”
              </p>
            )}
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatDateTime(item.at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
