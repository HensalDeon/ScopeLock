import { Check, MessageCircle } from "lucide-react";
import { formatDate } from "@/shared/lib/dates";
import { formatMoney, type Minor } from "@/shared/lib/money";
import { whatsappLink } from "@/shared/lib/phone";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import type { ScheduleTotals } from "../domain/gst";
import { nextStep, stillToAsk, type NextStep } from "../domain/next-step";
import type { ScheduleItem } from "../domain/payment";
import { PaymentActions } from "./payment-actions";
import {
  paymentActionProps,
  payReminder,
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
}: {
  items: ScheduleItem[];
  totals: ScheduleTotals;
  ctx: ScheduleRowContext;
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
          : "Nothing asked for",
      waiting: shown.due > 0,
    },
    { label: "Still to ask for", value: ask, note: "Not asked for yet" },
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
      aria-label="Where the money stands"
      className="overflow-hidden rounded-xl border bg-background"
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
      {step && <NextStepRow step={step} ctx={ctx} money={money} />}
    </section>
  );
}

function NextStepRow({
  step,
  ctx,
  money,
}: {
  step: NextStep;
  ctx: ScheduleRowContext;
  money: (amount: Minor) => string;
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
          {name} says they paid the {item.label} payment ({money(item.payable)}
          ). Check it reached your account, then confirm.
        </p>
        <div className="justify-self-start">
          <PaymentActions {...paymentActionProps(item, ctx)} primary />
        </div>
      </div>
    );
  }
  if (step.kind === "waiting") {
    const asked = item.payment?.requestedAt;
    const url =
      ctx.portalUrl && item.payment
        ? `${ctx.portalUrl}/pay/${item.payment.id}`
        : null;
    const text = url ? `${payReminder(item, ctx)} ${url}` : null;
    return (
      <div className={cn(row, "sm:flex sm:items-center sm:justify-between")}>
        <p className="text-sm text-pretty">
          Waiting for {name} to pay the {item.label} payment (
          <span className="tabular-nums">{money(item.payable)}</span>)
          {asked ? `, asked ${formatDate(asked)}` : ""}.
        </p>
        {text && (
          <Button
            asChild

            size="sm"
            className={cn("justify-self-start", TOUCH)}
          >
            <a
              href={
                ctx.client.phone
                  ? whatsappLink(ctx.client.phone, text)
                  : `https://wa.me/?text=${encodeURIComponent(text)}`
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden />
              Remind {name} on WhatsApp
            </a>
          </Button>
        )}
      </div>
    );
  }
  const unlockedBy = item.milestoneId
    ? ctx.unlockedBy[item.milestoneId]
    : undefined;
  return (
    <div className={row}>
      <p className="text-sm text-pretty text-muted-foreground">
        Next: the {item.label} payment
        {unlockedBy ? `, once “${unlockedBy}” is done` : ""}. Asking issues its
        invoice and gives {name} a page to pay it.
      </p>
      <div className="justify-self-start">
        <PaymentActions {...paymentActionProps(item, ctx)} primary />
      </div>
    </div>
  );
}
