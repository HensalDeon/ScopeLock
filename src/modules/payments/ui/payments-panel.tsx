import type { Route } from "next";
import Link from "next/link";
import { taxPreview } from "@/modules/invoices";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, type Minor } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import {
  PAYMENT_STATE_LABELS,
  type ScheduleItem,
  type ScheduleState,
} from "../domain/payment";
import { PaymentActions } from "./payment-actions";

const STATE_STYLES: Record<ScheduleState, string> = {
  upcoming: "border-border bg-muted text-muted-foreground",
  due: "border-warning/25 bg-warning-soft text-warning-ink",
  client_reported: "border-warning/40 bg-warning-soft text-warning-ink",
  received: "border-brand/25 bg-success-soft text-foreground",
};

export function PaymentStateBadge({ state }: { state: ScheduleState }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
        STATE_STYLES[state],
      )}
    >
      {state !== "upcoming" && (
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            state === "received" ? "bg-brand" : "bg-warning",
          )}
        />
      )}
      {PAYMENT_STATE_LABELS[state]}
    </span>
  );
}

/**
 * The project's payments once the scope is approved: each milestone (with
 * approved changes added) and separately-billed changes, what state it's
 * in, and what to do next. Server component; the actions are client pieces.
 */
export function PaymentsPanel({
  projectId,
  projectName,
  currency,
  items,
  totals,
  portalUrl,
  client,
  methodsReady,
  unlockedBy = {},
  gst = null,
  stateFallback = null,
}: {
  projectId: string;
  projectName: string;
  currency: CurrencyCode;
  items: ScheduleItem[];
  totals: { received: Minor; due: Minor; total: Minor };
  /** The client's link (null if it can't be shown). */
  portalUrl: string | null;
  client: { firstName: string; phone: string | null };
  /** False until at least one payment method is set up. */
  methodsReady: boolean;
  /** Milestone id → the timeline step that unlocks it ("Design"). */
  unlockedBy?: Record<string, string>;
  /** Invoices for this client carry GST (shown on payments not asked yet). */
  /** Your GST details and the client's, to show what each invoice will add. */
  gst?: {
    seller: Parameters<typeof taxPreview>[0];
    buyer: Parameters<typeof taxPreview>[1];
  } | null;
  /** GST applies but the client has no state or GSTIN on record. */
  stateFallback?: { yourState: string; clientHref: string } | null;
}) {
  const money = (amount: Minor) => formatMoney(amount, currency);
  return (
    <div className="grid gap-3">
      {!methodsReady && (
        <p className="rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-pretty text-warning-ink">
          Add how you get paid (UPI, bank or a payment link) in{" "}
          <Link
            href={"/settings/payments" as Route}
            className="font-medium underline underline-offset-4"
          >
            Settings → Payments
          </Link>{" "}
          before asking for a payment, so {client.firstName} knows how to pay.
        </p>
      )}
      <ol className="divide-y rounded-xl border bg-background">
        {items.map((item, index) => {
          const payable = item.payment?.payable ?? item.total;
          // Not asked yet: what its invoice will add (same rule as the invoice).
          const preview =
            !item.payment && gst
              ? taxPreview(gst.seller, gst.buyer, item.total)
              : null;
          return (
            <li key={item.key} className="grid gap-3 px-4 py-4 sm:px-5">
              <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1">
                <span className="pt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
                  {item.milestoneId ? index + 1 : "+"}
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
                  {item.payment?.invoice && (
                    <p className="text-xs text-muted-foreground">
                      <Link
                        href={
                          `/projects/${projectId}/invoices/${item.payment.invoice.id}` as Route
                        }
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        Invoice {item.payment.invoice.number}
                      </Link>
                      {item.payment.tax > 0 &&
                        ` · includes ${money(item.payment.tax)} GST`}
                    </p>
                  )}
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {money(payable)}
                </p>
              </div>
              <div className="sm:pl-[2.5rem]">
                <PaymentActions
                  item={item}
                  projectId={projectId}
                  amount={money(preview ? preview.total : payable)}
                  breakdown={
                    preview
                      ? `${money(item.total)} + ${money(preview.tax)} GST: ${preview.split}`
                      : undefined
                  }
                  clientFirstName={client.firstName}
                  stateFallback={stateFallback}
                  unlockedBy={
                    item.milestoneId ? unlockedBy[item.milestoneId] : undefined
                  }
                  share={
                    portalUrl && item.payment
                      ? {
                          url: `${portalUrl}/pay/${item.payment.id}`,
                          phone: client.phone,
                          message: `Hi ${client.firstName}, the ${item.label} payment for ${projectName} is due (${money(payable)}). You can pay by UPI or bank transfer here:`,
                        }
                      : null
                  }
                />
              </div>
            </li>
          );
        })}
      </ol>
      <dl className="flex flex-wrap justify-end gap-x-6 gap-y-1 px-1 text-sm tabular-nums">
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Received</dt>
          <dd className="font-medium">{money(totals.received)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Due now</dt>
          <dd
            className={cn("font-medium", totals.due > 0 && "text-warning-ink")}
          >
            {money(totals.due)}
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-semibold">{money(totals.total)}</dd>
        </div>
      </dl>
      {items.some((i) => (i.payment?.tax ?? 0) > 0) && (
        <p className="-mt-2 px-1 text-right text-xs text-muted-foreground">
          Totals are before GST, like the agreed price.
        </p>
      )}
    </div>
  );
}
