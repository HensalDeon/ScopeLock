import { Check } from "lucide-react";
import { formatDateTime } from "@/shared/lib/dates";
import { formatMoney, type Minor } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { ShareLink } from "@/shared/ui/share-link";
import { TOUCH, TOUCH_LINK } from "@/shared/ui/touch";
import type { ScheduleTotals } from "../domain/gst";
import {
  isReminder,
  nextStep,
  stillToAsk,
  type NextStep,
} from "../domain/next-step";
import type { ScheduleItem } from "../domain/payment";
import { PaymentActions } from "./payment-actions";
import {
  paymentActionProps,
  payMessage,
  type ScheduleRowContext,
} from "./schedule-row";

/**
 * Where an approved project's money stands, at the top of its page:
 * received, due, still to ask for and the total (with GST when there is
 * any), then the one next step. Server component.
 */
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
  setup: { methodsReady: boolean; invoicingReady: boolean };
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

function NextStepRow({
  step,
  ctx,
  money,
  now,
  setup,
  dueCount,
  dueTotal,
}: {
  step: NextStep;
  ctx: ScheduleRowContext;
  money: (amount: Minor) => string;
  now: Date;
  setup: { methodsReady: boolean; invoicingReady: boolean };
  dueCount: number;
  dueTotal: Minor;
}) {
  const name = ctx.client.firstName;
  const row = "grid gap-3 border-t bg-canvas px-4 py-4 sm:px-5";
  if (step.kind === "settled") {
    return (
      <p className={cn(row, "flex items-center gap-2 text-sm")}>
        <Check aria-hidden className="size-4 text-brand" />
        Every payment is in. Nothing left to ask for.
      </p>
    );
  }
  const { item } = step;
  if (step.kind === "confirm") {
    return (
      <div className={row}>
        <p className="text-sm font-medium text-pretty">
          {item.label},{" "}
          <span className="tabular-nums">{money(item.payable)}</span>: check it
          reached your account, then confirm.
        </p>
        <div className="justify-self-start">
          <PaymentActions {...paymentActionProps(item, ctx)} primary />
        </div>
      </div>
    );
  }
  if (step.kind === "waiting") {
    const payment = item.payment;
    const url =
      ctx.portalUrl && payment ? `${ctx.portalUrl}/pay/${payment.id}` : null;
    // The first message isn't a reminder: it becomes one after a few days.
    const reminder = !!payment && isReminder(payment.requestedAt, now);
    return (
      <div
        className={cn(
          row,
          "sm:flex sm:flex-wrap sm:items-center sm:justify-between",
        )}
      >
        <div className="grid gap-0.5">
          <p className="text-sm font-medium text-pretty">
            {dueCount > 1 ? (
              <>
                Waiting for {name} to pay {dueCount} payments,{" "}
                <span className="tabular-nums">{money(dueTotal)}</span>. Oldest:{" "}
                {item.label},{" "}
                <span className="tabular-nums">{money(item.payable)}</span>.
              </>
            ) : (
              <>
                Waiting for {name} to pay: {item.label},{" "}
                <span className="tabular-nums">{money(item.payable)}</span>.
              </>
            )}
          </p>
          {payment && (
            <p className="text-sm text-pretty text-muted-foreground tabular-nums">
              Asked {formatDateTime(payment.requestedAt)}
              {payment.invoice && (
                <>
                  {" with invoice "}
                  <span className="whitespace-nowrap">
                    {payment.invoice.number}
                  </span>
                </>
              )}
              {ctx.client.email ? ` · emailed to ${ctx.client.email}` : ""}
            </p>
          )}
        </div>
        {url && (
          <div className="justify-self-start">
            <ShareLink
              url={url}
              phone={ctx.client.phone}
              message={payMessage(item, ctx, { reminder })}
              compact
              copyLabel="Copy pay link"
              whatsappLabel={
                reminder
                  ? `Remind ${name} on WhatsApp`
                  : `Send ${name} the pay link on WhatsApp`
              }
            />
          </div>
        )}
      </div>
    );
  }
  const unlockedBy = item.milestoneId
    ? ctx.unlockedBy[item.milestoneId]
    : undefined;
  return (
    <div
      className={cn(
        row,
        "sm:flex sm:flex-wrap sm:items-center sm:justify-between",
      )}
    >
      <div className="grid gap-0.5">
        <p className="text-sm font-medium text-pretty">
          Next payment: {item.label},{" "}
          <span className="tabular-nums">{money(item.payable)}</span>.
          {setup.methodsReady && unlockedBy
            ? ` Ask once ${unlockedBy} is done.`
            : ""}
        </p>
        {/* Asking issues an invoice that can't change: set up first. */}
        {!setup.methodsReady ? (
          <p className="text-sm text-pretty text-muted-foreground">
            Before you ask {name}, add how you get paid (UPI, bank or a payment
            link) so the pay page and invoice can show it.
          </p>
        ) : (
          !setup.invoicingReady && (
            <p className="text-sm text-pretty text-muted-foreground">
              Invoices will show just your business name.{" "}
              <Link
                href="/settings/invoicing"
                className={cn(
                  "font-medium text-foreground underline underline-offset-4",
                  TOUCH_LINK,
                )}
              >
                Add your address or GSTIN
              </Link>{" "}
              first if you need them: issued invoices can&apos;t be changed.
            </p>
          )
        )}
      </div>
      <div className="justify-self-start">
        {setup.methodsReady ? (
          <PaymentActions {...paymentActionProps(item, ctx)} primary />
        ) : (
          <Button asChild className={TOUCH}>
            <Link href="/settings/payments">Add payment details</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
