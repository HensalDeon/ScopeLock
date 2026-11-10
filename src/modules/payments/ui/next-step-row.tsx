import { Check } from "lucide-react";
import { formatDateTime } from "@/shared/lib/dates";
import { type Minor } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { ShareLink } from "@/shared/ui/share-link";
import { TOUCH, TOUCH_LINK } from "@/shared/ui/touch";
import { isReminder, type NextStep } from "../domain/next-step";
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

/** The money strip's bottom row: the project's one next step. */
export function NextStepRow({
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
  setup: {
    methodsReady: boolean;
    invoicingReady: boolean;
    /** Client abroad, only UPI set up: a bank or link is needed first. */
    abroadNeedsBankOrLink?: boolean;
  };
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
                // Names the payment: other rows may have pay links too.
                reminder
                  ? `Remind ${name} about ${money(item.payable)} on WhatsApp`
                  : `Send ${name} the ${money(item.payable)} pay link on WhatsApp`
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
        {setup.methodsReady && setup.abroadNeedsBankOrLink ? (
          <p className="text-sm text-pretty text-muted-foreground">
            {name} is outside India, where UPI doesn&apos;t work. Add a bank
            account (with its SWIFT code) or a payment link before you ask.
          </p>
        ) : !setup.methodsReady ? (
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
        {setup.methodsReady && !setup.abroadNeedsBankOrLink ? (
          <PaymentActions {...paymentActionProps(item, ctx)} primary />
        ) : (
          <Button asChild className={TOUCH}>
            <Link href="/settings/payments">
              {setup.methodsReady ? "Add bank details" : "Add payment details"}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
