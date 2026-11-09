"use client";

import { formatIsoDate } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { ShareLink } from "@/shared/ui/share-link";
import {
  INLINE_PANEL_FOCUS,
  useInlinePanel,
} from "@/shared/ui/use-inline-panel";
import { AskPanel } from "./ask-panel";
import { ProofLink, ReceivedForm, RejectForm } from "./payment-forms";
import { Run } from "./run-action";
import { METHOD_LABELS } from "../domain/methods";
import type { ScheduleItem } from "../domain/payment";
import { cancelPaymentRequest } from "../server/actions";
import { confirmReportedPayment } from "../server/confirm-actions";

export function PaymentActions({
  item,
  projectId,
  amount,
  clientFirstName,
  clientEmail = null,
  share,
  stateFallback,
  exportCheck = null,
  abroadNeedsBankOrLink = false,
  breakdown,
  primary = false,
}: {
  /** Abroad but billed in rupees: may not count as an export (s.2(6)). */
  exportCheck?: { clientHref: string } | null;
  /** Client abroad with only UPI set up: asking is blocked until fixed. */
  abroadNeedsBankOrLink?: boolean;
  item: ScheduleItem;
  projectId: string;
  /** Formatted total, e.g. "₹47,000". */
  amount: string;
  clientFirstName: string;
  /** Where the request email goes, if the client has one on record. */
  clientEmail?: string | null;
  /** The client's page for this payment, for copy / WhatsApp. */
  share: { url: string; phone: string | null; message: string } | null;
  /** The page's next step: the ask button is the one filled button. */
  primary?: boolean;
  /** "₹28,800 + ₹5,184 GST: CGST 9% + SGST 9%", before it's asked for. */
  breakdown?: string;
  /** GST with no client state on record: the invoice uses yours. */
  stateFallback?: { yourState: string; clientHref: string } | null;
}) {
  const panels = useInlinePanel<"ask" | "reject" | "received" | "cancel">();
  const { open, close } = panels;
  const ids = { projectId, paymentId: item.payment?.id ?? "" };

  if (item.state === "upcoming") {
    return open === "ask" ? (
      <AskPanel
        panelProps={panels.panel(`Ask ${clientFirstName} for ${amount}`)}
        clientFirstName={clientFirstName}
        clientEmail={clientEmail}
        amount={amount}
        breakdown={breakdown}
        stateFallback={stateFallback}
        exportCheck={exportCheck}
        abroadNeedsBankOrLink={abroadNeedsBankOrLink}
        projectId={projectId}
        itemKey={item.key}
        onClose={close}
      />
    ) : (
      <Button
        type="button"
        size={primary ? "default" : "sm"}
        className={TOUCH}
        variant={primary ? "default" : "outline"}
        {...panels.trigger("ask")}
      >
        {primary ? `Ask ${clientFirstName} for ${amount}` : "Ask for payment"}
      </Button>
    );
  }

  if (item.state === "received") {
    const c = item.payment?.confirmation;
    return c ? (
      <p className="text-sm text-pretty text-muted-foreground">
        Received on {formatIsoDate(c.receivedOn)} · {METHOD_LABELS[c.method]}
        {c.reference ? ` · ${c.reference}` : ""}
      </p>
    ) : null;
  }

  if (item.state === "client_reported") {
    const r = item.payment?.report;
    return (
      <div className="grid gap-2">
        {r && (
          <div className="grid gap-0.5 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning-ink">
            <p>
              {clientFirstName} says they paid by {METHOD_LABELS[r.method]} on{" "}
              {formatIsoDate(r.paidOn)}.
            </p>
            <p className="font-mono text-xs">UTR {r.reference}</p>
            {r.note && <p className="text-pretty">“{r.note}”</p>}
            {r.hasProof && <ProofLink paymentId={ids.paymentId} />}
          </div>
        )}
        {open === "reject" ? (
          <div
            {...panels.panel(
              `Tell ${clientFirstName} the payment hasn't arrived`,
            )}
            className={cn("rounded-lg", INLINE_PANEL_FOCUS)}
          >
            <RejectForm
              ids={ids}
              onCancel={close}
              clientFirstName={clientFirstName}
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Run
              action={confirmReportedPayment}
              fields={ids}
              label="Confirm received"
              pendingLabel="Confirming…"
              variant={primary ? "default" : "outline"}
            />
            <Button
              type="button"
              size="sm"
              className={TOUCH}
              variant="outline"
              {...panels.trigger("reject")}
            >
              Not received
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Due.
  return (
    <div className="grid gap-2">
      {item.payment?.lastRejection && (
        <p className="text-sm text-muted-foreground">
          You told {clientFirstName}: “{item.payment.lastRejection.note}”
        </p>
      )}
      {share && (
        <ShareLink
          url={share.url}
          phone={share.phone}
          message={share.message}
          primary={primary}
          compact
          copyLabel="Copy pay link"
          whatsappLabel={`Send ${clientFirstName} the pay link on WhatsApp`}
        />
      )}
      {open === "cancel" ? (
        <div
          {...panels.panel(`Cancel the ${amount} request`)}
          className={cn(
            "grid gap-2 rounded-lg border bg-background p-3",
            INLINE_PANEL_FOCUS,
          )}
        >
          <p className="text-sm text-pretty">
            Cancel the{" "}
            <span className="font-medium tabular-nums">{amount}</span> request?{" "}
            {item.payment?.invoice
              ? `Invoice ${item.payment.invoice.number} is marked cancelled and `
              : ""}
            {clientFirstName}&apos;s pay page stops asking. You can ask again
            later; that issues a new invoice.
          </p>
          <div className="flex flex-wrap gap-2">
            <Run
              action={cancelPaymentRequest}
              fields={ids}
              label="Cancel request"
              pendingLabel="Cancelling…"
              variant="destructive"
            />
            <Button
              type="button"
              size="sm"
              className={TOUCH}
              variant="ghost"
              onClick={close}
            >
              Keep it
            </Button>
          </div>
        </div>
      ) : open === "received" ? (
        <div
          {...panels.panel("Mark the payment as received")}
          className={cn("rounded-lg", INLINE_PANEL_FOCUS)}
        >
          <ReceivedForm ids={ids} onCancel={close} />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className={TOUCH}
            variant="outline"
            {...panels.trigger("received")}
          >
            Mark as received
          </Button>
          <Button
            type="button"
            size="sm"
            className={TOUCH}
            variant="ghost"
            {...panels.trigger("cancel")}
          >
            Cancel request
          </Button>
        </div>
      )}
    </div>
  );
}
