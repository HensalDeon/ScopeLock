import type { Route } from "next";
import type { ComponentProps } from "react";
import Link from "next/link";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, type Minor } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { TOUCH_LINK } from "@/shared/ui/touch";
import type { ScheduleItem } from "../domain/payment";
import type { AutoRemindersContext } from "../server/project-money";
import { AutoReminderLine } from "./auto-reminder-line";
import { PaymentActions } from "./payment-actions";
import { PaymentStateBadge } from "./payment-state-badge";

export type ScheduleRowContext = {
  projectId: string;
  projectName: string;
  currency: CurrencyCode;
  client: { firstName: string; phone: string | null; email: string | null };
  /** The client's link (null if it can't be shown). */
  portalUrl: string | null;
  /** Milestone id → the timeline step that unlocks it ("Design"). */
  unlockedBy: Record<string, string>;
  /** GST applies but the client has no state or GSTIN on record. */
  stateFallback: { yourState: string; clientHref: string } | null;
  /** Abroad but billed in rupees: may not count as an export. */
  exportCheck?: { clientHref: string } | null;
  /** The client is outside India: a zero-GST row is an export. */
  exportClient?: boolean;
  /** Client abroad with only UPI set up: asking waits for bank or link. */
  abroadNeedsBankOrLink?: boolean;
  /** Payment details are set up (asking needs them). */
  methodsReady?: boolean;
  /** How this client can pay, in words ("UPI or bank transfer"). */
  payBy?: string;
  /** Archived project: show the payments, offer no actions. */
  readOnly?: boolean;
  /** Automatic reminders (Pro, Agency), and the client's page for an email. */
  autoReminders?: AutoRemindersContext & { clientHref: string | null };
  /** When the page was read. */
  now?: Date;
};

/**
 * One payment: what it's for, what the client pays (GST included, with the
 * split underneath), its invoice, and what to do next.
 */
export function ScheduleRow({
  item,
  number,
  ctx,
  actedAbove = null,
}: {
  item: ScheduleItem;
  /** The money strip offers this payment's next action: point there. */
  actedAbove?: "ask" | "confirm" | "waiting" | null;
  /** Position among milestones; null for a change paid separately. */
  number: number | null;
  ctx: ScheduleRowContext;
}) {
  const money = (amount: Minor) => formatMoney(amount, ctx.currency);
  const invoice = item.payment?.invoice;
  return (
    <li className="grid gap-3 px-4 py-4 sm:px-5">
      <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1">
        <span className="pt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
          {number === null ? "+" : String(number).padStart(2, "0")}
        </span>
        <div className="grid min-w-0 gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{item.label}</p>
            <PaymentStateBadge state={item.state} />
          </div>
          {item.lines.length > 0 && (
            <ul className="grid gap-0.5 text-xs text-pretty text-muted-foreground tabular-nums">
              {item.lines.map((line) => (
                <li key={`${line.kind}-${line.refId}`}>
                  {line.description}: {money(line.amount)}
                </li>
              ))}
            </ul>
          )}
          {item.tax > 0 ? (
            <p className="text-xs text-muted-foreground tabular-nums">
              {item.lines.length === 1
                ? `+ ${money(item.tax)} GST`
                : `${money(item.total)} + ${money(item.tax)} GST`}
            </p>
          ) : (
            ctx.exportClient && (
              <p className="text-xs text-muted-foreground">
                No GST: export under LUT
              </p>
            )
          )}
          {invoice && (
            <p className="text-xs tabular-nums">
              <Link
                href={
                  `/projects/${ctx.projectId}/invoices/${invoice.id}` as Route
                }
                className={cn(
                  "font-medium text-foreground underline-offset-4 hover:underline",
                  TOUCH_LINK,
                )}
              >
                Invoice {invoice.number}
              </Link>
            </p>
          )}
        </div>
        <p className="text-sm font-semibold tabular-nums">
          {money(item.payable)}
        </p>
      </div>
      {!ctx.readOnly && (
        <div className="pl-[2.5rem]">
          {actedAbove === "waiting" ? (
            // The strip sends the reminder; the row keeps the bookkeeping.
            <div className="grid gap-1">
              <a
                href={`#money-${ctx.projectId}`}
                className={cn(
                  "text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
                  TOUCH_LINK,
                )}
              >
                Its pay link is at the top of the page
              </a>
              <PaymentActions {...paymentActionProps(item, ctx)} share={null} />
            </div>
          ) : actedAbove ? (
            <div className="grid gap-1">
              <a
                href={`#money-${ctx.projectId}`}
                className={cn(
                  "text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
                  TOUCH_LINK,
                )}
              >
                Next step, at the top of the page
              </a>
            </div>
          ) : (
            <PaymentActions {...paymentActionProps(item, ctx)} />
          )}
        </div>
      )}
      {/* The money strip shows it for the payment it's waiting on. */}
      {item.payment && actedAbove !== "waiting" && (
        <div className="pl-[2.5rem]">
          <AutoReminderLine payment={item.payment} ctx={ctx} />
        </div>
      )}
    </li>
  );
}

/** The actions for one payment, shared by its row and the next-step strip. */
export function paymentActionProps(
  item: ScheduleItem,
  ctx: ScheduleRowContext,
): ComponentProps<typeof PaymentActions> {
  const money = (amount: Minor) => formatMoney(amount, ctx.currency);
  return {
    item,
    projectId: ctx.projectId,
    amount: money(item.payable),
    breakdown: item.taxSplit
      ? `${money(item.total)} + ${money(item.tax)} GST: ${item.taxSplit}`
      : undefined,
    clientFirstName: ctx.client.firstName,
    clientEmail: ctx.client.email,
    stateFallback: ctx.stateFallback,
    exportCheck: ctx.exportCheck ?? null,
    abroadNeedsBankOrLink: ctx.abroadNeedsBankOrLink ?? false,
    methodsReady: ctx.methodsReady ?? true,
    share:
      ctx.portalUrl && item.payment
        ? {
            url: `${ctx.portalUrl}/pay/${item.payment.id}`,
            phone: ctx.client.phone,
            message: payMessage(item, ctx),
          }
        : null,
  };
}

/** WhatsApp text for a payment that's due (the link goes after it). */
export function payMessage(
  item: ScheduleItem,
  ctx: ScheduleRowContext,
  { reminder = true }: { reminder?: boolean } = {},
) {
  const amount = formatMoney(item.payable, ctx.currency);
  return reminder
    ? `Hi ${ctx.client.firstName}, a reminder: the payment for ${ctx.projectName} is due (${item.label}, ${amount}). ${payHere(ctx.payBy)}`
    : `Hi ${ctx.client.firstName}, here's the invoice for ${ctx.projectName} (${item.label}, ${amount}). ${payHere(ctx.payBy)}`;
}

const payHere = (by?: string) =>
  by ? `You can pay by ${by} here:` : "You can pay here:";
