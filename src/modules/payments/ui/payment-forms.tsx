"use client";

import { Download } from "lucide-react";
import { useActionState, useId, useState, useTransition } from "react";
import { todayInIndia } from "@/shared/lib/dates";
import { IDLE } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
import { announcing } from "@/shared/ui/announce";
import { TOUCH } from "@/shared/ui/touch";
import { Input } from "@/shared/ui/input";
import { NativeSelect } from "@/shared/ui/native-select";
import { Textarea } from "@/shared/ui/textarea";
import { METHOD_KINDS, METHOD_LABELS } from "../domain/methods";
import type { PaymentFormState } from "../server/actions";
import {
  markNotReceived,
  markPaymentReceived,
  paymentProofUrl,
} from "../server/confirm-actions";

/** The forms under a payment row: received, not received, the proof link. */

export function ProofLink({ paymentId }: { paymentId: string }) {
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

export function ReceivedForm({
  ids,
  onCancel,
}: {
  ids: { projectId: string; paymentId: string };
  onCancel: () => void;
}) {
  const uid = useId();
  const [state, action, pending] = useActionState<PaymentFormState, FormData>(
    announcing(markPaymentReceived, `money-${ids.projectId}`),
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
        <Button type="submit" size="sm" className={TOUCH} disabled={pending}>
          {pending ? "Saving…" : "Mark as received"}
        </Button>
        <Button
          type="button"
          size="sm"
          className={TOUCH}
          variant="ghost"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function RejectForm({
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
    announcing(markNotReceived, `money-${ids.projectId}`),
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
        <Button type="submit" size="sm" className={TOUCH} disabled={pending}>
          {pending ? "Sending…" : "Send to client"}
        </Button>
        <Button
          type="button"
          size="sm"
          className={TOUCH}
          variant="ghost"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
