import { formatMoney } from "@/shared/lib/money";
import type { RecoveredTotals } from "../domain/recovered";

const changes = (n: number) => `${n} change${n === 1 ? "" : "s"}`;

/**
 * Revenue recovered: what clients' extra requests are now worth, priced and
 * approved. The one place on the overview where emerald means "money you
 * would otherwise have given away". One line per currency.
 */
export function RecoveredStrip({ rows }: { rows: RecoveredTotals[] }) {
  return (
    <section
      aria-labelledby="recovered-title"
      className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border bg-success-soft/40 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-10"
    >
      <div className="col-span-2 grid gap-1 sm:col-span-1">
        <h2
          id="recovered-title"
          className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase"
        >
          <span aria-hidden className="size-1.5 rounded-full bg-brand" />
          Revenue recovered
        </h2>
        <p className="text-[13px] text-pretty text-muted-foreground">
          {rows.length > 0
            ? "Extra work your clients asked for, priced and approved instead of done for free."
            : "When a client approves a change request, its price adds up here: extra work you didn't do for free."}
        </p>
      </div>
      {rows.length > 0 && (
        <>
          <Figure
            label="This month"
            rows={rows.map((r) => ({
              key: r.currency,
              amount: formatMoney(r.thisMonth, r.currency),
              note: changes(r.thisMonthCount),
              zero: r.thisMonth === 0,
            }))}
          />
          <Figure
            label="All time"
            rows={rows.map((r) => ({
              key: r.currency,
              amount: formatMoney(r.allTime, r.currency),
              note: changes(r.allTimeCount),
              zero: false,
            }))}
          />
        </>
      )}
    </section>
  );
}

function Figure({
  label,
  rows,
}: {
  label: string;
  rows: { key: string; amount: string; note: string; zero: boolean }[];
}) {
  return (
    <div className="grid content-start gap-1 sm:text-right">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      {rows.map((r) => (
        <p key={r.key} className="flex items-baseline gap-2 sm:justify-end">
          <span
            className={
              r.zero
                ? "text-xl font-semibold tracking-[-0.02em] text-muted-foreground tabular-nums"
                : "text-xl font-semibold tracking-[-0.02em] text-success-ink tabular-nums"
            }
          >
            {r.amount}
          </span>
          <span className="text-[12px] text-muted-foreground tabular-nums">
            {r.note}
          </span>
        </p>
      ))}
    </div>
  );
}
