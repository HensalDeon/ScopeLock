import type { CurrencyTotals } from "@/modules/projects";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

/**
 * Where the money stands, one line per currency. Payments due and received
 * join in Phase 5.
 */
export function MoneyStrip({ rows }: { rows: CurrencyTotals[] }) {
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`;
  const approvedCount = rows.reduce((s, r) => s + r.approvedProjects, 0);
  const draftCount = rows.reduce((s, r) => s + r.draftProjects, 0);
  const waitingAny = rows.some((r) => r.waiting > 0);
  const cells = [
    {
      label: "Approved work",
      amounts: rows.map((r) => ({ c: r.currency, v: r.approved })),
      note: approvedCount
        ? plural(approvedCount, "project")
        : "None approved yet",
      tone: "neutral" as const,
    },
    {
      label: "Waiting on clients",
      amounts: rows.map((r) => ({ c: r.currency, v: r.waiting })),
      note: waitingAny ? "Sent, not answered yet" : "Nothing waiting",
      tone: waitingAny ? ("waiting" as const) : ("neutral" as const),
    },
    {
      label: "In draft",
      amounts: rows.map((r) => ({ c: r.currency, v: r.draft })),
      note: draftCount
        ? `${plural(draftCount, "project")} not sent`
        : "Nothing in draft",
      tone: "neutral" as const,
    },
  ];
  return (
    <section
      aria-label="Money at a glance"
      className="grid divide-y rounded-xl border bg-background sm:grid-cols-3 sm:divide-x sm:divide-y-0"
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
