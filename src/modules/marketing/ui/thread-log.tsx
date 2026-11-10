import { cn } from "@/shared/lib/utils";

/**
 * The landing page's one grammar: a dated log, like a chat thread kept as a
 * ledger. A mono time gutter on the left, the entry in the middle, what was
 * billed in a right-hand figure column, totals on a canvas footer.
 */

const ROW =
  "grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[5.5rem_minmax(0,1fr)_11rem] sm:gap-x-6";

export function Log({
  heads,
  footer,
  className,
  label,
  children,
}: {
  /** Column heads: time, entry, billed. */
  heads: [string, string, string];
  footer?: React.ReactNode;
  /** What the log is, for screen readers. */
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("border-t border-foreground", className)}>
      <div
        aria-hidden
        className={cn(
          ROW,
          "border-b py-2.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase",
        )}
      >
        <span>{heads[0]}</span>
        <span className="truncate">{heads[1]}</span>
        <span className="hidden text-right sm:block">{heads[2]}</span>
      </div>
      <ol aria-label={label}>{children}</ol>
      {footer}
    </div>
  );
}

export function LogRow({
  time,
  who,
  billed,
  ghost = false,
  strong = false,
  className,
  children,
}: {
  time: string;
  /** "Rahul", "You": who wrote the line. */
  who?: string;
  /** The figure in the billed column ("+ ₹15,000"). */
  billed?: React.ReactNode;
  /** Already agreed or never billed: sits back. */
  ghost?: boolean;
  /** A priced line: the figure in full weight. */
  strong?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <li className={cn(ROW, "border-b py-3.5 short:py-2.5", className)}>
      <span className="pt-1 font-mono text-[12px] text-muted-foreground tabular-nums sm:self-center sm:pt-0">
        {time}
      </span>
      <div
        className={cn(
          "grid min-w-0 gap-1.5 sm:flex sm:items-center sm:gap-5",
          ghost && "text-muted-foreground",
        )}
      >
        {who && (
          <span className="shrink-0 text-[12px] text-muted-foreground sm:w-24">
            {who}
          </span>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {billed != null && (
        <span
          className={cn(
            "col-start-2 pt-1 text-[15px] tabular-nums sm:col-start-3 sm:self-center sm:pt-0 sm:text-right sm:text-[16px]",
            ghost && "text-muted-foreground",
            strong && "font-semibold",
          )}
        >
          <span className="sr-only">Amount: </span>
          {billed}
        </span>
      )}
    </li>
  );
}

/** A day break in the log ("28 Oct"). */
export function LogDate({ children }: { children: React.ReactNode }) {
  return (
    <li className={cn(ROW, "border-b bg-canvas py-2")}>
      <span className="col-span-full px-3 font-mono text-[12px] text-muted-foreground sm:col-span-1 sm:col-start-2 sm:px-0">
        {children}
      </span>
    </li>
  );
}

/** The log's total, on a canvas footer. */
export function LogTotal({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(ROW, "items-baseline bg-canvas py-4 sm:py-5", className)}
    >
      <p className="col-start-2 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase sm:col-start-2">
        {label}
      </p>
      <div className="col-start-2 mt-1 sm:col-start-3 sm:mt-0 sm:text-right">
        {children}
      </div>
    </div>
  );
}

/** One chat line: the client's on canvas, yours on paper with an ink edge. */
export function Bubble({
  from = "client",
  className,
  children,
}: {
  from?: "client" | "you";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "w-fit max-w-[30rem] border px-4 py-2.5 text-[15px] leading-snug text-pretty sm:text-[16px]",
        from === "client"
          ? "rounded-[14px] rounded-bl-[4px] bg-canvas"
          : "rounded-[14px] rounded-br-[4px] border-foreground/25 bg-background",
        className,
      )}
    >
      {children}
    </p>
  );
}
