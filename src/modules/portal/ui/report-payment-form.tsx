"use client";

import { useActionState, useId, useRef, useState, useTransition } from "react";
import {
  METHOD_LABELS,
  reportInputSchema,
  type MethodKind,
  type ReportField,
} from "@/modules/payments";
import { todayInIndia } from "@/shared/lib/dates";
import { IDLE } from "@/shared/lib/form-state";
import { ALLOWED_IMAGE_TYPES } from "@/shared/lib/image-type";
import { shrinkImage } from "@/shared/lib/shrink-image";
import {
  focusFirstInvalid,
  useFormValidation,
} from "@/shared/lib/use-form-validation";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { Input } from "@/shared/ui/input";
import { NativeSelect } from "@/shared/ui/native-select";
import { Textarea } from "@/shared/ui/textarea";
import type { ReportState } from "../server/payment-actions";

/**
 * "I've paid": how, the UTR, when, and an optional screenshot (shrunk in
 * the browser, checked again on the server). The freelancer confirms it.
 */
export function ReportPaymentForm({
  action: report,
  methods,
  amount,
  businessName,
  allowProof,
}: {
  action: (state: ReportState, data: FormData) => Promise<ReportState>;
  /** The ways offered, default first; "other" is always possible. */
  methods: MethodKind[];
  amount: string;
  businessName: string;
  allowProof: boolean;
}) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState<ReportState, FormData>(
    report,
    IDLE,
  );
  const [, startTransition] = useTransition();
  const [fileError, setFileError] = useState<string | null>(null);
  const today = todayInIndia();
  const options: MethodKind[] = [
    ...methods,
    ...(methods.includes("other") ? [] : (["other"] as const)),
  ];
  const [values, setValues] = useState<Record<ReportField, string>>({
    method: options[0] ?? "other",
    reference: "",
    paidOn: today,
    note: "",
  });
  const form = useFormValidation(reportInputSchema(today), values, {
    serverState: state,
  });
  const set =
    (name: ReportField) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
      form.edited(name);
    };

  if (state.status === "success") {
    return (
      <p
        role="status"
        className="rounded-lg border border-brand/25 bg-success-soft px-4 py-3 text-sm font-medium"
      >
        {state.message} {businessName} will check it and confirm.
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.markSubmitted()) {
          focusFirstInvalid(formRef.current);
          return;
        }
        const data = new FormData();
        for (const [k, v] of Object.entries(values)) data.set(k, v);
        const file = fileRef.current?.files?.[0];
        startTransition(async () => {
          if (file) {
            if (
              !ALLOWED_IMAGE_TYPES.includes(
                file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
              )
            ) {
              setFileError("Use a PNG, JPG or WebP screenshot.");
              return;
            }
            try {
              const blob = await shrinkImage(file, {
                maxDimension: 1600,
                keepAlpha: false,
              });
              data.set(
                "proof",
                new File([blob], "screenshot", { type: blob.type }),
              );
            } catch {
              setFileError(
                "That file couldn't be read as an image. Try another, or send without it.",
              );
              return;
            }
          }
          setFileError(null);
          action(data);
        });
      }}
    >
      {state.status === "error" && state.message && (
        <FormAlert>{state.message}</FormAlert>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${uid}-method`}>How you paid</FieldLabel>
          <NativeSelect
            id={`${uid}-method`}
            value={values.method}
            onChange={set("method")}
            className="w-full"
          >
            {options.map((k) => (
              <option key={k} value={k}>
                {METHOD_LABELS[k]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field data-invalid={Boolean(form.errorFor("paidOn")) || undefined}>
          <FieldLabel htmlFor={`${uid}-paidOn`}>Paid on</FieldLabel>
          <Input
            id={`${uid}-paidOn`}
            type="date"
            max={today}
            value={values.paidOn}
            onChange={set("paidOn")}
            onBlur={() => form.touch("paidOn")}
            aria-invalid={Boolean(form.errorFor("paidOn")) || undefined}
          />
          <FieldError>{form.errorFor("paidOn")}</FieldError>
        </Field>
      </div>
      <Field data-invalid={Boolean(form.errorFor("reference")) || undefined}>
        <FieldLabel htmlFor={`${uid}-reference`}>
          UTR or transaction ID
        </FieldLabel>
        <Input
          id={`${uid}-reference`}
          value={values.reference}
          onChange={set("reference")}
          onBlur={() => form.touch("reference")}
          maxLength={40}
          autoComplete="off"
          placeholder="431209876543"
          aria-invalid={Boolean(form.errorFor("reference")) || undefined}
          className="font-mono"
        />
        <FieldDescription>
          In your UPI app or bank statement, next to this payment.
        </FieldDescription>
        <FieldError>{form.errorFor("reference")}</FieldError>
      </Field>
      {allowProof && (
        <Field>
          <FieldLabel htmlFor={`${uid}-proof`}>
            Screenshot (optional)
          </FieldLabel>
          <Input
            id={`${uid}-proof`}
            ref={fileRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={() => setFileError(null)}
            className="h-auto py-1.5"
          />
          <FieldDescription>
            Of the payment confirmation. PNG, JPG or WebP.
          </FieldDescription>
          {fileError && <p className="text-sm text-destructive">{fileError}</p>}
        </Field>
      )}
      <Field data-invalid={Boolean(form.errorFor("note")) || undefined}>
        <FieldLabel htmlFor={`${uid}-note`}>Note (optional)</FieldLabel>
        <Textarea
          id={`${uid}-note`}
          rows={2}
          maxLength={300}
          value={values.note}
          onChange={set("note")}
        />
        <FieldError>{form.errorFor("note")}</FieldError>
      </Field>
      <div className="grid gap-2">
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="w-full sm:w-auto sm:justify-self-start"
        >
          {pending ? "Sending…" : `I've paid ${amount}`}
        </Button>
        <FieldDescription>
          {businessName} checks their account and confirms. You&apos;ll see it
          here when they do.
        </FieldDescription>
      </div>
    </form>
  );
}
