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
import { cn } from "@/shared/lib/utils";
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
import { TOUCH } from "@/shared/ui/touch";
import {
  INLINE_PANEL_FOCUS,
  useInlinePanel,
} from "@/shared/ui/use-inline-panel";
import type { ReportState } from "../server/payment-actions";

/**
 * "I've paid": how, the UTR, when, and an optional screenshot (shrunk in
 * the browser, checked again on the server). The freelancer confirms it.
 * Folded behind one button so the page leads with paying, not reporting.
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
  const fold = useInlinePanel();
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

  if (!fold.open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="lg"
        className={cn("w-full sm:w-auto sm:justify-self-start", TOUCH)}
        {...fold.trigger("open")}
      >
        I&apos;ve paid {amount}
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      {...fold.panel(`Tell ${businessName} you've paid`)}
      className={cn("grid gap-5 rounded-lg", INLINE_PANEL_FOCUS)}
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
          aria-invalid={Boolean(form.errorFor("reference")) || undefined}
          className="font-mono"
        />
        <FieldDescription>
          {options.includes("upi")
            ? "For UPI, the 12-digit number in your UPI app's payment details. For a bank transfer, it's next to the payment on your statement."
            : "The reference next to the payment on your bank statement or receipt."}
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
            className="h-auto py-1.5 max-sm:py-2.5"
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
      <div className="grid gap-3">
        <FieldDescription>
          {businessName} checks their account and confirms. You&apos;ll see it
          here when they do.
        </FieldDescription>
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className={cn("max-sm:w-full", TOUCH)}
          >
            {pending ? "Sending…" : `Send to ${businessName}`}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className={cn("max-sm:w-full", TOUCH)}
            onClick={fold.close}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
