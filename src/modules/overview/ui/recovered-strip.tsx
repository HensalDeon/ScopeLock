import type { Route } from "next";
import Link from "next/link";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatDate } from "@/shared/lib/dates";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import type { RecoveredTotals } from "../domain/recovered";

const changes = (n: number) => `${n} change${n === 1 ? "" : "s"}`;

type Value = {
  key: CurrencyCode;
  amount: string;
  note: string;
  muted: boolean;
};
type Figure = { label: string; values: Value[] | string };

/** The figures to show: one for "all this month", else month and all time; then received. */
function figuresFor(rows: RecoveredTotals[]): Figure[] {
  const value = (
    r: RecoveredTotals,
    amount: RecoveredTotals["allTime"],
    note: string,
  ): Value => ({
    key: r.currency,
    amount: formatMoney(amount, r.currency),
    note,
    muted: amount === 0,
  });
  const allThisMonth = rows.every((r) => r.thisMonth === r.allTime);
  const approved: Figure[] = allThisMonth
    ? [
        {
          label: "All this month",
          values: rows.map((r) => value(r, r.allTime, changes(r.allTimeCount))),
        },
      ]
    : [
        {
          label: "This month",
          values: rows.every((r) => r.thisMonth === 0)
            ? "None yet"
            : rows.map((r) => value(r, r.thisMonth, changes(r.thisMonthCount))),
        },
        {
          label: "All time",
          values: rows.map((r) => value(r, r.allTime, changes(r.allTimeCount))),
        },
      ];
  return [
    ...approved,
    {
      label: "Received so far",
      values: rows.map((r) =>
        value(
          r,
          r.received,
          r.received === r.allTime ? "all of it" : "paid to you",
        ),
      ),
    },
  ];
}

/**
 * Revenue recovered: extra work clients asked for, priced and approved
 * (approved change requests, before GST), with how much of it has been
 * received (approval isn't payment). Emerald only once something is
 * approved: it marks money recovered (DESIGN.md, Settled Green Rule).
 * One line per currency, never summed across currencies.
 */
export function RecoveredStrip({
  rows,
  latest,
  beforeGst,
}: {
  rows: RecoveredTotals[];
  /** The latest approved change, to say what the number is made of. */
  latest: {
    label: string;
    title: string;
    project: string;
    href: string;
    approvedAt: Date;
  } | null;
  /** The workspace charges GST: say these amounts are before it. */
  beforeGst: boolean;
}) {
  const empty = rows.length === 0;
  return (
    <section
      aria-labelledby="recovered-title"
      className={cn(
        "grid gap-4 rounded-xl border px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-10",
        empty ? "bg-background" : "bg-success-soft/40",
      )}
    >
      <div className="grid gap-1">
        <h2
          id="recovered-title"
          className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase"
        >
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              empty ? "bg-muted-foreground/50" : "bg-brand",
            )}
          />
          Revenue recovered
        </h2>
        <p className="text-[13px] text-pretty text-muted-foreground">
          {empty
            ? "When a client approves a change request, its price adds up here: extra work you didn't do for free."
            : `Extra work your clients asked for, priced and approved instead of done for free.${beforeGst ? " Before GST." : ""}`}
        </p>
        {latest && (
          <p className="text-[13px] text-pretty text-muted-foreground">
            Latest:{" "}
            <Link
              href={latest.href as Route}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {latest.label} {latest.title}
            </Link>{" "}
            on {latest.project}, approved {formatDate(latest.approvedAt)}.
          </p>
        )}
        {!empty && (
          <p className="text-[13px]">
            <Link
              href="/reports"
              className="font-medium text-foreground underline underline-offset-4 max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
            >
              Revenue recovered by client and by month
            </Link>
          </p>
        )}
      </div>
      {!empty && (
        // Phones: one ledger row per figure (label left, amount right, count
        // under it). Wider: the figures side by side, right-aligned.
        <dl className="grid sm:flex sm:gap-10">
          {figuresFor(rows).map((f) => (
            <div
              key={f.label}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 border-t border-foreground/10 py-2 first:border-t-0 first:pt-0 last:pb-0 sm:block sm:border-0 sm:py-0 sm:text-right"
            >
              <dt className="text-[12px] text-muted-foreground">{f.label}</dt>
              <dd className="grid justify-items-end gap-1 sm:mt-1">
                {typeof f.values === "string" ? (
                  <span className="text-sm text-muted-foreground">
                    {f.values}
                  </span>
                ) : (
                  f.values.map((v) => (
                    <span
                      key={v.key}
                      className="grid justify-items-end sm:flex sm:items-baseline sm:gap-2"
                    >
                      <span
                        className={cn(
                          "text-xl font-semibold tracking-[-0.02em] whitespace-nowrap tabular-nums",
                          v.muted
                            ? "text-muted-foreground"
                            : "text-success-ink",
                        )}
                      >
                        {v.amount}
                      </span>
                      <span className="text-[12px] whitespace-nowrap text-muted-foreground tabular-nums">
                        <span className="sr-only">, </span>
                        {v.note}
                      </span>
                    </span>
                  ))
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
