"use client";

import type { Route } from "next";
import Link from "next/link";
import { useActionState } from "react";
import { formatIsoDate } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";
import { IDLE } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { ShareLink } from "@/shared/ui/share-link";
import {
  INLINE_PANEL_FOCUS,
  useInlinePanel,
} from "@/shared/ui/use-inline-panel";
import { ProofLink, ReceivedForm, RejectForm } from "./payment-forms";
import { METHOD_LABELS } from "../domain/methods";
import type { ScheduleItem } from "../domain/payment";
import {
  cancelPaymentRequest,
  requestPayment,
  type PaymentFormState,
} from "../server/actions";
import { confirmReportedPayment } from "../server/confirm-actions";

type Action = (s: PaymentFormState, d: FormData) => Promise<PaymentFormState>;

/** One button that runs an action, with a pending label and its error. */
function Run({
  action: run,
  fields,
  label,
  pendingLabel,
  variant = "default",
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
}) {
  const [state, action, pending] = useActionState<PaymentFormState, FormData>(
    run,
    IDLE,
  );
  return (
    <form action={action} className="grid gap-1.5">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button
        type="submit"
        size="sm"
        className={TOUCH}
        variant={variant}
        disabled={pending}
      >
        {pending ? pendingLabel : label}
      </Button>
      {state.status === "error" && (state.message || state.fieldErrors) && (
        <p role="alert" className="text-sm text-destructive">
          {state.message ?? Object.values(state.fieldErrors ?? {})[0]}
        </p>
      )}
    </form>
  );
}

export function PaymentActions({
  item,
  projectId,
  amount,
  clientFirstName,
  share,
  stateFallback,
  breakdown,
  primary = false,
}: {
  item: ScheduleItem;
  projectId: string;
  /** Formatted total, e.g. "₹47,000". */
  amount: string;
  clientFirstName: string;
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
      <div
        {...panels.panel(`Ask ${clientFirstName} for ${amount}`)}
        className={cn(
          "grid gap-2 rounded-lg border bg-background p-3",
          INLINE_PANEL_FOCUS,
        )}
      >
        <p className="text-sm">
          Ask {clientFirstName} for{" "}
          <span className="font-medium tabular-nums">{amount}</span>
          {breakdown && (
            <span className="text-muted-foreground tabular-nums">
              {" "}
              ({breakdown})
            </span>
          )}
          ? This issues a numbered invoice. They see both on their link, and by
          email if you&apos;ve added theirs.
        </p>
        {stateFallback && (
          <p className="rounded-md bg-warning-soft px-3 py-2 text-sm text-pretty text-warning-ink">
            {clientFirstName}&apos;s state isn&apos;t set, so this invoice uses
            yours ({stateFallback.yourState}) and charges CGST + SGST. If
            they&apos;re in another state,{" "}
            <Link
              href={stateFallback.clientHref as Route}
              className="font-medium underline underline-offset-4"
            >
              add their state or GSTIN
            </Link>{" "}
            first.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Run
            action={requestPayment}
            fields={{ projectId, key: item.key }}
            label={`Ask for ${amount}`}
            pendingLabel="Asking…"
          />
          <Button
            type="button"
            size="sm"
            className={TOUCH}
            variant="ghost"
            onClick={close}
          >
            Not yet
          </Button>
        </div>
      </div>
    ) : (
      <Button
        type="button"
        size="sm"
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
              {r.paidOn}.
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
