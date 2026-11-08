"use client";

import type { Route } from "next";
import Link from "next/link";
import { useActionState, useLayoutEffect, useState } from "react";
import { formatIsoDate } from "@/shared/lib/dates";
import { IDLE } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import { ShareLink } from "@/shared/ui/share-link";
import { ProofLink, ReceivedForm, RejectForm } from "./payment-forms";
import { METHOD_LABELS } from "../domain/methods";
import type { ScheduleItem } from "../domain/payment";
import {
  cancelPaymentRequest,
  confirmReportedPayment,
  requestPayment,
  type PaymentFormState,
} from "../server/actions";

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
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
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

/** Opens a small panel under the row; closes when the page is hidden. */
function useOpen() {
  const [open, setOpen] = useState<string | null>(null);
  useLayoutEffect(() => () => setOpen(null), []);
  return [open, setOpen] as const;
}

export function PaymentActions({
  item,
  projectId,
  amount,
  clientFirstName,
  share,
  unlockedBy,
  stateFallback,
}: {
  item: ScheduleItem;
  projectId: string;
  /** Formatted total, e.g. "₹47,000". */
  amount: string;
  clientFirstName: string;
  /** The client's page for this payment, for copy / WhatsApp. */
  share: { url: string; phone: string | null; message: string } | null;
  /** The timeline step that unlocks this payment ("Design"), if linked. */
  unlockedBy?: string;
  /** GST with no client state on record: the invoice uses yours. */
  stateFallback?: { yourState: string; clientHref: string } | null;
}) {
  const [open, setOpen] = useOpen();
  const ids = { projectId, paymentId: item.payment?.id ?? "" };

  if (item.state === "upcoming") {
    return open === "ask" ? (
      <div className="grid gap-2 rounded-lg border bg-background p-3">
        <p className="text-sm">
          Ask {clientFirstName} for{" "}
          <span className="font-medium tabular-nums">{amount}</span>? This
          issues a numbered invoice. They see both on their link, and by email
          if you&apos;ve added theirs.
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
            variant="ghost"
            onClick={() => setOpen(null)}
          >
            Not yet
          </Button>
        </div>
      </div>
    ) : (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen("ask")}
      >
        {unlockedBy
          ? `“${unlockedBy}” done: ask for ${amount}`
          : "Ask for payment"}
      </Button>
    );
  }

  if (item.state === "received") {
    const c = item.payment?.confirmation;
    return c ? (
      <p className="text-sm text-muted-foreground">
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
            <p className="font-mono text-[13px]">UTR {r.reference}</p>
            {r.note && <p className="text-pretty">“{r.note}”</p>}
            {r.hasProof && <ProofLink paymentId={ids.paymentId} />}
          </div>
        )}
        {open === "reject" ? (
          <RejectForm
            ids={ids}
            onCancel={() => setOpen(null)}
            clientFirstName={clientFirstName}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            <Run
              action={confirmReportedPayment}
              fields={ids}
              label="Confirm received"
              pendingLabel="Confirming…"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setOpen("reject")}
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
        />
      )}
      {open === "received" ? (
        <ReceivedForm ids={ids} onCancel={() => setOpen(null)} />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setOpen("received")}
          >
            Mark as received
          </Button>
          <Run
            action={cancelPaymentRequest}
            fields={ids}
            label="Cancel request"
            pendingLabel="Cancelling…"
            variant="ghost"
          />
        </div>
      )}
    </div>
  );
}
