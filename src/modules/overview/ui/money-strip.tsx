import type { CurrencyTotals } from "../domain/portfolio";
import { formatMoney, minor } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

/**
 * Where the money stands across approved projects, one line per currency,
 * in the same order and with the same counting as a project's own strip:
 * received, due now, still to ask for, and the approved total (with GST
 * where the payments carry it).
 */
export function MoneyStrip({ rows }: { rows: CurrencyTotals[] }) {
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`;
  const approvedCount = rows.reduce((s, r) => s + r.approvedProjects, 0);
  const taxed = rows.find((r) => r.tax > 0);
  const any = (pick: (r: CurrencyTotals) => number) =>
    rows.some((r) => pick(r) > 0);
  const cells = [
    {
      label: "Received",
      amounts: rows.map((r) => ({ c: r.currency, v: r.received })),
      note: "Confirmed by you",
      waiting: false,
    },
    {
      label: "Due now",
      amounts: rows.map((r) => ({ c: r.currency, v: r.due })),
      note: any((r) => r.due)
        ? "Asked for, not received yet"
        : "Nothing waiting to be paid",
      waiting: true,
    },
    {
      label: "Still to ask for",
      amounts: rows.map((r) => ({ c: r.currency, v: r.toAsk })),
      note: any((r) => r.toAsk)
        ? "In your payment terms, not asked yet"
        : approvedCount
          ? "Every payment has been asked for"
          : "Nothing approved yet",
      waiting: false,
    },
    {
      label: taxed ? "Total with GST" : "Total",
      amounts: rows.map((r) => ({ c: r.currency, v: r.total })),
      note: taxed
        ? `${formatMoney(minor(taxed.total - taxed.tax), taxed.currency)} + ${formatMoney(taxed.tax, taxed.currency)} GST · ${plural(approvedCount, "project")}`
        : approvedCount
          ? plural(approvedCount, "project")
          : "None approved yet",
      waiting: false,
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
                  a.v === 0 && "text-muted-foreground",
                  cell.waiting && a.v > 0 && "text-warning-ink",
                )}
              >
                {formatMoney(a.v, a.c)}
              </p>
            ))}
          </div>
          <p className="text-sm text-pretty text-muted-foreground">
            {cell.note}
          </p>
        </div>
      ))}
    </section>
  );
}
