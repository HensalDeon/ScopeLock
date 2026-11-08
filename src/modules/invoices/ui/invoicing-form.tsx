"use client";

import { useActionState, useId, useRef, useState, useTransition } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { gstinState, INDIAN_STATES, isGstinFormat } from "@/shared/lib/india";
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
import { Section } from "@/shared/ui/page";
import { Textarea } from "@/shared/ui/textarea";
import { invoicingInputSchema, type InvoicingField } from "../domain/invoice";
import { updateInvoicing, type InvoicingFormState } from "../server/actions";

type Values = Record<InvoicingField, string>;

/**
 * Settings → Invoicing: what goes at the top of every invoice, the number
 * series, and the GST details. Without a GSTIN invoices carry no GST.
 */
export function InvoicingForm({
  defaults,
  nextNumber,
}: {
  defaults: Values;
  nextNumber: string;
}) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<InvoicingFormState, FormData>(
    updateInvoicing,
    IDLE,
  );
  const [, startTransition] = useTransition();
  const [values, setValues] = useState(defaults);
  const form = useFormValidation(invoicingInputSchema, values, {
    initial: defaults,
    serverState: state,
  });

  const set = (name: InvoicingField, value: string) => {
    setValues((v) => {
      const next = { ...v, [name]: value };
      // A valid GSTIN decides the state.
      if (name === "gstin" && isGstinFormat(value.trim().toUpperCase())) {
        next.state = gstinState(value.trim().toUpperCase()) ?? v.state;
      }
      return next;
    });
    form.edited(name);
  };
  const field = (name: InvoicingField) => ({
    id: `${uid}-${name}`,
    name,
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(name, e.target.value),
    onBlur: () => form.touch(name),
    "aria-invalid": Boolean(form.errorFor(name)) || undefined,
    autoComplete: "off",
  });
  const row = (
    name: InvoicingField,
    label: string,
    hint?: string,
    extra: React.ComponentProps<typeof Input> = {},
  ) => (
    <Field data-invalid={Boolean(form.errorFor(name)) || undefined}>
      <FieldLabel htmlFor={`${uid}-${name}`}>{label}</FieldLabel>
      <Input {...field(name)} {...extra} />
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError>{form.errorFor(name)}</FieldError>
    </Field>
  );
  const registered = values.gstin.trim().length > 0;

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
        title="Your details"
        description="Shown under “From” on every invoice. Leave the legal name blank to use your business name."
      >
        <div className="grid gap-5">
          {row(
            "legalName",
            registered ? "Legal name" : "Legal name (optional)",
            "As on your PAN or GST registration.",
            {
              placeholder: "Asha Menon",
            },
          )}
          <Field data-invalid={Boolean(form.errorFor("address")) || undefined}>
            <FieldLabel htmlFor={`${uid}-address`}>
              {registered ? "Registered address" : "Address (optional)"}
            </FieldLabel>
            <Textarea
              rows={3}
              maxLength={300}
              placeholder="12/482 Pallimukku Road, Kochi, Kerala 682016"
              {...field("address")}
            />
            <FieldError>{form.errorFor("address")}</FieldError>
          </Field>
        </div>
      </Section>
      <Section
        title="GST"
        description="Only if you're registered. With a GSTIN, invoices become tax invoices with 18% GST. Each invoice compares the client's state with yours: same state, CGST 9% + SGST 9%; another state, IGST 18%; outside India, no GST (export under LUT). Add each client's GSTIN or state on their client page; without either, your state is used."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {row(
            "gstin",
            "GSTIN (optional)",
            "15 characters. Your state is taken from it.",
            {
              placeholder: "32ABCDE1234F1Z5",
              maxLength: 15,
              className: "font-mono uppercase",
            },
          )}
          <Field data-invalid={Boolean(form.errorFor("state")) || undefined}>
            <FieldLabel htmlFor={`${uid}-state`}>Your state</FieldLabel>
            <NativeSelect
              id={`${uid}-state`}
              name="state"
              value={values.state}
              onChange={(e) => set("state", e.target.value)}
              className="w-full"
            >
              <option value="">Choose a state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
            <FieldError>{form.errorFor("state")}</FieldError>
          </Field>
          {row(
            "sac",
            "SAC code",
            "998314 covers IT design and development. Change it if your CA says so.",
            {
              inputMode: "numeric",
              maxLength: 8,
            },
          )}
          {row(
            "lutArn",
            "LUT ARN (for clients abroad)",
            "From your Letter of Undertaking (form RFD-11) for this financial year. Export invoices are then zero-rated.",
            {
              placeholder: "AD320426012345X",
              className: "font-mono uppercase",
            },
          )}
        </div>
      </Section>
      <Section
        title="Invoice numbers"
        description="Numbers run in order and restart each financial year (April to March), as GST requires."
      >
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {row("prefix", "Prefix", "Up to 5 letters or digits.", {
              maxLength: 5,
              className: "font-mono uppercase",
            })}
            {row(
              "startNumber",
              "Start this year from",
              "If you've already issued invoices this year elsewhere, continue from the next number.",
              {
                inputMode: "numeric",
              },
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Next invoice:{" "}
            <span className="font-mono text-foreground tabular-nums">
              {nextNumber}
            </span>
            {form.isDirty && " (before these changes)"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending || !form.isDirty}>
              {pending ? "Saving…" : "Save invoice details"}
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
