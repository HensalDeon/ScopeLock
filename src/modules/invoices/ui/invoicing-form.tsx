"use client";

import { useActionState, useId, useRef, useState, useTransition } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { gstinState, INDIAN_STATES, isGstinFormat } from "@/shared/lib/india";
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
import { Input } from "@/shared/ui/input";
import { NativeSelect } from "@/shared/ui/native-select";
import { Section } from "@/shared/ui/page";
import { Textarea } from "@/shared/ui/textarea";
import {
  invoicingInputSchema,
  previewInvoiceNumber,
  type InvoicingField,
} from "../domain/invoice";
import { updateInvoicing, type InvoicingFormState } from "../server/actions";

type Values = Record<InvoicingField, string>;

/**
 * Settings → Invoicing: what goes at the top of every invoice, the number
 * series, and the GST details. Without a GSTIN invoices carry no GST.
 */
export function InvoicingForm({
  defaults,
  series,
}: {
  defaults: Values;
  /** This financial year's series so far, for the live next number. */
  series: { fyShort: string; lastSerial: number };
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
  useUnsavedGuard(form.isDirty && !pending);

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
            "As on your PAN or GST registration, like Asha Menon.",
          )}
          <Field data-invalid={Boolean(form.errorFor("address")) || undefined}>
            <FieldLabel htmlFor={`${uid}-address`}>
              {registered ? "Registered address" : "Address (optional)"}
            </FieldLabel>
            <Textarea rows={3} maxLength={300} {...field("address")} />
            <FieldError>{form.errorFor("address")}</FieldError>
          </Field>
        </div>
      </Section>
      <Section
        title="GST"
        description="Fill this in only if you're registered for GST. Leave the GSTIN blank and your invoices carry no GST."
      >
        {/* What each invoice will charge, so nobody has to remember the rule. */}
        <dl className="mb-5 grid gap-x-6 gap-y-1.5 rounded-lg border bg-canvas px-4 py-3 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
          <dt className="text-muted-foreground">Client in your state</dt>
          <dd className="tabular-nums">CGST 9% + SGST 9%</dd>
          <dt className="text-muted-foreground">Client in another state</dt>
          <dd className="tabular-nums">IGST 18%</dd>
          <dt className="text-muted-foreground">Client outside India</dt>
          <dd>No GST, with your LUT (below)</dd>
        </dl>
        <p className="mb-5 text-sm text-muted-foreground">
          The client&apos;s state comes from their GSTIN or the state on their
          client page; without either, yours is used.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          {row(
            "gstin",
            "GSTIN (optional)",
            "15 characters, like 32ABCDE1234F1Z5. Your state is taken from it.",
            {
              maxLength: 15,
              className: "font-mono uppercase",
            },
          )}
          {/* State, SAC and LUT only matter with a GSTIN; kept when hidden. */}
          {registered ? (
            <>
              <Field
                data-invalid={Boolean(form.errorFor("state")) || undefined}
              >
                <FieldLabel htmlFor={`${uid}-state`}>
                  {registered ? "Your state" : "Your state (optional)"}
                </FieldLabel>
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
                "The service code printed on each invoice line. 998314 covers IT design and development, which fits most web, app and design work.",
                {
                  inputMode: "numeric",
                  maxLength: 8,
                },
              )}
              {row(
                "lutArn",
                "LUT ARN (only if you bill clients outside India)",
                "File a Letter of Undertaking (form RFD-11) on the GST portal once each financial year. It's free and lets you bill clients abroad without GST. Paste the ARN from the acknowledgement, like AD320426012345X. Without it, you can't ask clients outside India for payment.",
                {
                  className: "font-mono uppercase",
                },
              )}
            </>
          ) : (
            <>
              {(["state", "sac", "lutArn"] as const).map((name) => (
                <input
                  key={name}
                  type="hidden"
                  name={name}
                  value={values[name]}
                />
              ))}
              <p className="text-sm text-muted-foreground sm:col-span-2">
                Your state, SAC code and LUT appear here once you add a GSTIN.
              </p>
            </>
          )}
        </div>
      </Section>
      <Section
        title="Invoice numbers"
        description="Numbers run in order and restart each financial year (April to March), as GST requires."
      >
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {row(
              "prefix",
              "Prefix",
              "Up to 5 letters, digits or hyphens, like INV.",
              {
                maxLength: 5,
                className: "font-mono uppercase",
              },
            )}
            {row(
              "startNumber",
              "Start this year from",
              series.lastSerial > 0
                ? "You've issued invoices this year, so the series continues from the last one."
                : "If you've issued invoices elsewhere this year, continue from the next number.",
              {
                inputMode: "numeric",
                readOnly: series.lastSerial > 0,
              },
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Next invoice:{" "}
            <span
              aria-live="polite"
              className="font-mono text-foreground tabular-nums"
            >
              {previewInvoiceNumber(
                values.prefix,
                values.startNumber,
                series,
              ) ?? "fix the prefix to see it"}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              className={TOUCH}
              disabled={pending || !form.isDirty}
            >
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
