import type { Route } from "next";
import type { ComponentProps } from "react";
import Link from "next/link";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, type Minor } from "@/shared/lib/money";
import type { ScheduleItem } from "../domain/payment";
import { PaymentActions } from "./payment-actions";
import { PaymentStateBadge } from "./payment-state-badge";

export type ScheduleRowContext = {
  projectId: string;
  projectName: string;
  currency: CurrencyCode;
  client: { firstName: string; phone: string | null };
  /** The client's link (null if it can't be shown). */
  portalUrl: string | null;
  /** Milestone id → the timeline step that unlocks it ("Design"). */
  unlockedBy: Record<string, string>;
  /** GST applies but the client has no state or GSTIN on record. */
  stateFallback: { yourState: string; clientHref: string } | null;
};

/**
 * One payment: what it's for, what the client pays (GST included, with the
 * split underneath), its invoice, and what to do next.
 */
export function ScheduleRow({
  item,
  number,
  ctx,
}: {
  item: ScheduleItem;
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
          {number ?? "+"}
        </span>
        <div className="grid min-w-0 gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{item.label}</p>
            <PaymentStateBadge state={item.state} />
          </div>
          {(item.lines.length > 1 || item.percent === null) && (
            <ul className="grid gap-0.5 text-xs text-muted-foreground tabular-nums">
              {item.lines.map((line) => (
                <li key={`${line.kind}-${line.refId}`}>
                  {line.description}: {money(line.amount)}
                </li>
              ))}
            </ul>
          )}
          {(item.tax > 0 || invoice) && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {item.tax > 0 &&
                `${money(item.total)} + ${money(item.tax)} GST${invoice ? " · " : ""}`}
              {invoice && (
                <Link
                  href={
                    `/projects/${ctx.projectId}/invoices/${invoice.id}` as Route
                  }
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Invoice {invoice.number}
                </Link>
              )}
            </p>
          )}
        </div>
        <p className="text-sm font-semibold tabular-nums">
          {money(item.payable)}
        </p>
      </div>
      <div className="sm:pl-[2.5rem]">
        <PaymentActions {...paymentActionProps(item, ctx)} />
      </div>
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
    stateFallback: ctx.stateFallback,
    unlockedBy: item.milestoneId ? ctx.unlockedBy[item.milestoneId] : undefined,
    share:
      ctx.portalUrl && item.payment
        ? {
            url: `${ctx.portalUrl}/pay/${item.payment.id}`,
            phone: ctx.client.phone,
            message: payReminder(item, ctx),
          }
        : null,
  };
}

/** WhatsApp text for a payment that's due (the link goes after it). */
export function payReminder(item: ScheduleItem, ctx: ScheduleRowContext) {
  return `Hi ${ctx.client.firstName}, the ${item.label} payment for ${ctx.projectName} is due (${formatMoney(item.payable, ctx.currency)}). You can pay by UPI or bank transfer here:`;
}
