"use client";

import { Download } from "lucide-react";
import {
  useActionState,
  useId,
  useLayoutEffect,
  useState,
  useTransition,
} from "react";
import { formatIsoDate, todayInIndia } from "@/shared/lib/dates";
import { IDLE } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { NativeSelect } from "@/shared/ui/native-select";
import { ShareLink } from "@/shared/ui/share-link";
import { Textarea } from "@/shared/ui/textarea";
import { METHOD_KINDS, METHOD_LABELS } from "../domain/methods";
import type { ScheduleItem } from "../domain/payment";
import {
  cancelPaymentRequest,
  confirmReportedPayment,
  markNotReceived,
  markPaymentReceived,
  paymentProofUrl,
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
}) {
  const [open, setOpen] = useOpen();
  const ids = { projectId, paymentId: item.payment?.id ?? "" };

  if (item.state === "upcoming") {
    return open === "ask" ? (
      <div className="grid gap-2 rounded-lg border bg-background p-3">
        <p className="text-sm">
          Ask {clientFirstName} for{" "}
          <span className="font-medium tabular-nums">{amount}</span>? They see
          it on their link, and by email if you&apos;ve added theirs.
        </p>
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

function ProofLink({ paymentId }: { paymentId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
        onClick={() =>
          start(async () => {
            const result = await paymentProofUrl(paymentId);
            if ("url" in result) window.location.assign(result.url);
            else setError(result.error);
          })
        }
      >
        <Download aria-hidden className="size-3.5" />
        {pending ? "Getting screenshot…" : "Download screenshot"}
      </button>
      {error && <span className="text-destructive">{error}</span>}
    </span>
  );
}

function ReceivedForm({
  ids,
  onCancel,
}: {
  ids: { projectId: string; paymentId: string };
  onCancel: () => void;
}) {
  const uid = useId();
  const [state, action, pending] = useActionState<PaymentFormState, FormData>(
    markPaymentReceived,
    IDLE,
  );
  const err = (name: string) =>
    state.status === "error" ? state.fieldErrors?.[name] : undefined;
  return (
    <form
      action={action}
      className="grid gap-3 rounded-lg border bg-background p-3"
    >
      <input type="hidden" name="projectId" value={ids.projectId} />
      <input type="hidden" name="paymentId" value={ids.paymentId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm" htmlFor={`${uid}-method`}>
          How it was paid
          <NativeSelect
            id={`${uid}-method`}
            name="method"
            defaultValue="upi"
            className="w-full"
          >
            {METHOD_KINDS.map((k) => (
              <option key={k} value={k}>
                {METHOD_LABELS[k]}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="grid gap-1 text-sm" htmlFor={`${uid}-reference`}>
          Reference (optional)
          <Input
            id={`${uid}-reference`}
            name="reference"
            placeholder="UTR"
            maxLength={40}
          />
        </label>
        <label className="grid gap-1 text-sm" htmlFor={`${uid}-receivedOn`}>
          Received on
          <Input
            id={`${uid}-receivedOn`}
            name="receivedOn"
            type="date"
            max={todayInIndia()}
            defaultValue={todayInIndia()}
          />
        </label>
      </div>
      {state.status === "error" &&
        (state.message ||
          err("receivedOn") ||
          err("method") ||
          err("reference")) && (
          <p role="alert" className="text-sm text-destructive">
            {state.message ??
              err("receivedOn") ??
              err("method") ??
              err("reference")}
          </p>
        )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Mark as received"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function RejectForm({
  ids,
  onCancel,
  clientFirstName,
}: {
  ids: { projectId: string; paymentId: string };
  onCancel: () => void;
  clientFirstName: string;
}) {
  const uid = useId();
  const [state, action, pending] = useActionState<PaymentFormState, FormData>(
    markNotReceived,
    IDLE,
  );
  return (
    <form
      action={action}
      className="grid gap-2 rounded-lg border bg-background p-3"
    >
      <input type="hidden" name="projectId" value={ids.projectId} />
      <input type="hidden" name="paymentId" value={ids.paymentId} />
      <label className="grid gap-1 text-sm" htmlFor={`${uid}-note`}>
        What should {clientFirstName} check?
        <Textarea
          id={`${uid}-note`}
          name="note"
          rows={2}
          maxLength={300}
          placeholder="I can't see this UTR in my account. Could you check it?"
        />
      </label>
      {state.status === "error" &&
        (state.message || state.fieldErrors?.note) && (
          <p role="alert" className="text-sm text-destructive">
            {state.message ?? state.fieldErrors?.note}
          </p>
        )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Sending…" : "Send to client"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
