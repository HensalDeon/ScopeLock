import { cn } from "@/shared/lib/utils";

/**
 * What a list shows before it has anything: what will appear here and how to
 * add the first one. Never just "No data".
 */
export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid justify-items-start gap-3 rounded-xl border border-dashed bg-canvas px-5 py-8 sm:px-8",
        className,
      )}
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground">
        {children}
      </p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** Placeholder rows with the same shape as a list, while it streams in. */
export function ListSkeleton({
  rows = 3,
  search = false,
}: {
  rows?: number;
  /** The list has a search box above it: hold its place. */
  search?: boolean;
}) {
  const list = (
    <div aria-hidden className="divide-y rounded-xl border bg-background">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="grid flex-1 gap-2">
            <div className="h-3.5 w-40 rounded bg-muted" />
            <div className="h-3 w-28 rounded bg-muted/70" />
          </div>
          <div className="h-3.5 w-20 rounded bg-muted/70" />
        </div>
      ))}
    </div>
  );
  return search ? (
    <div aria-hidden className="grid gap-4">
      <div className="h-8 rounded-lg border bg-background max-sm:h-11" />
      {list}
    </div>
  ) : (
    list
  );
}
