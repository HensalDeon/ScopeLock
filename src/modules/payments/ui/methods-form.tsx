"use client";

import { useActionState, useId, useRef, useState, useTransition } from "react";
import { IDLE } from "@/shared/lib/form-state";
import {
  focusFirstInvalid,
  useFormValidation,
} from "@/shared/lib/use-form-validation";
import { useUnsavedGuard } from "@/shared/ui/use-unsaved-guard";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { ImageUploadField } from "@/shared/ui/image-upload-field";
import { Input } from "@/shared/ui/input";
import { NativeSelect } from "@/shared/ui/native-select";
import { Section } from "@/shared/ui/page";
import { Textarea } from "@/shared/ui/textarea";
import {
  METHOD_LABELS,
  methodsInputSchema,
  type MethodField,
  type MethodKind,
} from "../domain/methods";
import {
  removePaymentQr,
  updatePaymentMethods,
  uploadPaymentQr,
  type MethodsFormState,
} from "../server/settings-actions";

type Values = Record<MethodField, string>;

/**
 * Settings → Payments: how clients pay you. Every method is optional; fill
 * in the ones you use and pick a default. The QR image uploads on its own.
 */
export function PaymentMethodsForm({
  defaults,
  qrUrl: initialQrUrl,
  uploadsEnabled,
}: {
  defaults: Values;
  qrUrl: string | null;
  uploadsEnabled: boolean;
}) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<MethodsFormState, FormData>(
    updatePaymentMethods,
    IDLE,
  );
  const [, startTransition] = useTransition();
  const [values, setValues] = useState(defaults);
  const [qrUrl, setQrUrl] = useState(initialQrUrl);
  const form = useFormValidation(methodsInputSchema, values, {
    initial: defaults,
    serverState: state,
  });
  useUnsavedGuard(form.isDirty && !pending);

  const field = (
    name: MethodField,
    extra: { placeholder?: string; inputMode?: "text" | "numeric" } = {},
  ) => ({
    id: `${uid}-${name}`,
    name,
    value: values[name],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
      form.edited(name);
    },
    onBlur: () => form.touch(name),
    "aria-invalid": Boolean(form.errorFor(name)) || undefined,
    autoComplete: "off",
    ...extra,
  });
  const row = (name: MethodField, label: string, hint?: string, extra = {}) => (
    <Field data-invalid={Boolean(form.errorFor(name)) || undefined}>
      <FieldLabel htmlFor={`${uid}-${name}`}>{label}</FieldLabel>
      <Input {...field(name, extra)} />
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError>{form.errorFor(name)}</FieldError>
    </Field>
  );

  // Which methods are filled in (the default must be one of them).
  const filled: MethodKind[] = [
    ...(values.upiVpa && values.upiPayee ? (["upi"] as const) : []),
    ...(values.bankAccountName && values.bankAccountNumber
      ? (["bank"] as const)
      : []),
    ...(values.linkUrl && values.linkLabel ? (["link"] as const) : []),
    ...(qrUrl ? (["qr"] as const) : []),
    ...(values.otherInstructions.trim() ? (["other"] as const) : []),
  ];

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.markSubmitted()) {
          focusFirstInvalid(formRef.current);
          return;
        }
        startTransition(() => action(new FormData(event.currentTarget)));
      }}
    >
      {state.status === "error" && state.message && (
        <div className="mb-6">
          <FormAlert>{state.message}</FormAlert>
        </div>
      )}
      <Section
        title="UPI"
        description="Clients paying in rupees scan a QR with the amount filled in, or tap to open their UPI app."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {row("upiVpa", "UPI ID", undefined, { placeholder: "asha@okhdfc" })}
          {row(
            "upiPayee",
            "Name on UPI",
            "As your UPI app shows it, so clients know the payment reaches you.",
          )}
        </div>
      </Section>
      <Section
        title="Bank transfer"
        description="For NEFT, IMPS or RTGS. Add a SWIFT code (and IBAN if you have one) for payments from abroad."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {row("bankAccountName", "Account holder")}
          {row("bankAccountNumber", "Account number", undefined, {
            inputMode: "numeric",
          })}
          {row("bankIfsc", "IFSC", undefined, { placeholder: "HDFC0001234" })}
          {row("bankName", "Bank", undefined, { placeholder: "HDFC Bank" })}
          {row("bankBranch", "Branch (optional)")}
          {row(
            "bankSwift",
            "SWIFT code (optional)",
            "For international payments.",
          )}
          {row("bankIban", "IBAN (optional)")}
        </div>
      </Section>
      <Section
        title="Payment link"
        description="A Razorpay, PayPal, Wise or Stripe link. Works for any currency."
      >
        <div className="grid gap-5 sm:grid-cols-[12rem_minmax(0,1fr)]">
          {row("linkLabel", "Name", undefined, { placeholder: "Razorpay" })}
          {row("linkUrl", "Link", undefined, {
            placeholder: "https://rzp.io/l/your-page",
          })}
        </div>
      </Section>
      <Section
        title="QR code"
        description="A QR from another app (a shop QR, a wallet). Shown as is, without the amount, for rupee projects."
      >
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <ImageUploadField
            label="QR image"
            hint="PNG, JPG or WebP. A clear, square image works best."
            url={qrUrl}
            enabled={uploadsEnabled}
            onChange={setQrUrl}
            upload={uploadPaymentQr}
            remove={removePaymentQr}
            maxDimension={1000}
            shape="square"
            emptyText="No QR uploaded"
            alt="Your payment QR code"
          />
          {row("qrLabel", "Caption", "Shown above the QR.", {
            placeholder: "Scan with GPay",
          })}
        </div>
      </Section>
      <Section
        title="Other"
        description="Anything else, like cash or cheque, in your own words."
      >
        <Field
          data-invalid={
            Boolean(form.errorFor("otherInstructions")) || undefined
          }
        >
          <FieldLabel htmlFor={`${uid}-otherInstructions`}>
            Instructions (optional)
          </FieldLabel>
          <Textarea rows={3} {...field("otherInstructions")} />
          <FieldError>{form.errorFor("otherInstructions")}</FieldError>
        </Field>
      </Section>
      <Section
        title="Default"
        description="Shown first to your client. They can still use the others."
      >
        <div className="grid gap-5">
          <Field>
            <FieldLabel htmlFor={`${uid}-defaultMethod`}>
              Default method
            </FieldLabel>
            <NativeSelect
              id={`${uid}-defaultMethod`}
              name="defaultMethod"
              value={values.defaultMethod}
              onChange={(e) => {
                setValues((v) => ({ ...v, defaultMethod: e.target.value }));
                form.edited("defaultMethod");
              }}
              className="w-full sm:w-72"
            >
              <option value="">No default</option>
              {filled.map((kind) => (
                <option key={kind} value={kind}>
                  {METHOD_LABELS[kind]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              className={TOUCH}
              disabled={pending || !form.isDirty}
            >
              {pending ? "Saving…" : "Save payment details"}
            </Button>
            <p role="status" className="text-sm text-muted-foreground">
              {state.status === "success" && !form.isDirty
                ? state.message
                : !form.isDirty
                  ? "No changes yet"
                  : ""}
            </p>
          </div>
        </div>
      </Section>
    </form>
  );
}
