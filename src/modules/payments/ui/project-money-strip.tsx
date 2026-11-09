import { formatMoney, type Minor } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import type { ScheduleTotals } from "../domain/gst";
import { nextStep, stillToAsk } from "../domain/next-step";
import type { ScheduleItem } from "../domain/payment";
import { type ScheduleRowContext } from "./schedule-row";

/**
 * Where an approved project's money stands, at the top of its page:
 * received, due, still to ask for and the total (with GST when there is
 * any), then the one next step. Server component.
 */
import { NextStepRow } from "./next-step-row";

export function ProjectMoneyStrip({
  items,
  totals,
  ctx,
  now,
  setup,
}: {
  items: ScheduleItem[];
  totals: ScheduleTotals;
  ctx: ScheduleRowContext;
  /** When the data was read (from the server query). */
  now: Date;
  /** Asking issues an invoice that can't change: what's set up first. */
  setup: {
    methodsReady: boolean;
    invoicingReady: boolean;
    /** Client abroad, only UPI set up: a bank or link is needed first. */
    abroadNeedsBankOrLink?: boolean;
  };
}) {
  const money = (amount: Minor) => formatMoney(amount, ctx.currency);
  const shown = totals.gst ?? totals;
  const ask = stillToAsk(items);
  const step = nextStep(items);
  const cells = [
    { label: "Received", value: shown.received, note: "Confirmed by you" },
    {
      label: "Due now",
      value: shown.due,
      note:
        shown.due > 0
          ? `Asked, waiting for ${ctx.client.firstName}`
          : "Nothing waiting to be paid",
      waiting: shown.due > 0,
    },
    {
      label: "Still to ask for",
      value: ask,
      note: ask > 0 ? "Not asked yet" : "Every payment has been asked for",
    },
    {
      label: totals.gst ? "Total with GST" : "Total",
      value: shown.total,
      note: totals.gst
        ? `${money(totals.total)} + ${money(totals.gst.tax)} GST`
        : "Agreed scope and approved changes",
    },
  ];
  return (
    <section
      id={`money-${ctx.projectId}`}
      tabIndex={-1}
      aria-label="Where the money stands"
      // Takes focus after a money action: visible for keyboard users.
      className="overflow-hidden rounded-xl border bg-background outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <dl className="grid grid-cols-2 lg:grid-cols-4 lg:[&>*]:border-b-0 lg:[&>*:not(:last-child)]:border-r [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(odd)]:border-r">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="grid content-start gap-1 px-4 py-3.5 sm:px-5"
          >
            <dt className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
              {cell.label}
            </dt>
            <dd
              className={cn(
                "text-xl font-semibold tracking-[-0.02em] tabular-nums sm:text-2xl",
                cell.waiting && "text-warning-ink",
                // A zero is an answer, not money: keep it quiet.
                cell.value === 0 && "text-muted-foreground",
              )}
            >
              {money(cell.value)}
            </dd>
            <dd className="text-xs text-pretty text-muted-foreground sm:text-sm">
              {cell.note}
            </dd>
          </div>
        ))}
      </dl>
      {step && (
        <NextStepRow
          step={step}
          ctx={ctx}
          money={money}
          now={now}
          setup={setup}
          dueCount={items.filter((i) => i.state === "due").length}
          dueTotal={shown.due}
        />
      )}
    </section>
  );
}
