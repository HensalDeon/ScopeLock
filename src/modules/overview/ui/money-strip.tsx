import type { CurrencyTotals } from "../domain/portfolio";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

/**
 * Where the money stands, one line per currency: approved work, what's been
 * received, what's due now, and what's still waiting for the client's yes.
 */
export function MoneyStrip({
  rows,
  gst,
}: {
  rows: CurrencyTotals[];
  /** Say which figures include GST (approved work is the price before it). */
  gst: boolean;
}) {
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`;
  const approvedCount = rows.reduce((s, r) => s + r.approvedProjects, 0);
  const waitingAny = rows.some((r) => r.waiting > 0);
  const cells = [
    {
      label: "Approved work",
      amounts: rows.map((r) => ({ c: r.currency, v: r.approved })),
      note: approvedCount
        ? `${plural(approvedCount, "project")}${gst ? " · before GST" : ""}`
        : "None approved yet",
      tone: "neutral" as const,
    },
    {
      label: "Received",
      amounts: rows.map((r) => ({ c: r.currency, v: r.received })),
      note: gst ? "Confirmed, GST included" : "Payments you've confirmed",
      tone: "neutral" as const,
    },
    {
      label: "Due now",
      amounts: rows.map((r) => ({ c: r.currency, v: r.due })),
      note: rows.some((r) => r.due > 0)
        ? gst
          ? "Asked for, GST included"
          : "Asked for, not received yet"
        : "Nothing due",
      tone: rows.some((r) => r.due > 0)
        ? ("waiting" as const)
        : ("neutral" as const),
    },
    {
      label: "Awaiting approval",
      amounts: rows.map((r) => ({ c: r.currency, v: r.waiting })),
      note: waitingAny ? "Sent, not answered yet" : "Nothing waiting",
      tone: waitingAny ? ("waiting" as const) : ("neutral" as const),
    },
  ];
  return (
    <section
      aria-label="Money at a glance"
      className="grid grid-cols-2 rounded-xl border bg-background lg:grid-cols-4 lg:[&>*]:border-b-0 lg:[&>*:not(:last-child)]:border-r [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(odd)]:border-r"
    >
      {cells.map((cell) => (
        <div key={cell.label} className="grid content-start gap-1.5 px-5 py-4">
          <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            {cell.label}
          </p>
          <div className="grid gap-0.5">
            {cell.amounts.map((a) => (
              <p
                key={a.c}
                className={cn(
                  "text-2xl font-semibold tracking-[-0.02em] tabular-nums",
                  cell.tone === "waiting" && a.v > 0 && "text-warning-ink",
                )}
              >
                {formatMoney(a.v, a.c)}
              </p>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{cell.note}</p>
        </div>
      ))}
    </section>
  );
}
