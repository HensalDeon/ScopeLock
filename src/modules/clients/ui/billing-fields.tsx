"use client";

import { gstOutcome, type InvoicingSettings } from "@/modules/invoices";
import {
  gstinState,
  INDIAN_STATES,
  isGstinFormat,
  isIndia,
  stateName,
  type StateCode,
} from "@/shared/lib/india";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { NativeSelect } from "@/shared/ui/native-select";
import { Textarea } from "@/shared/ui/textarea";
import type { ClientField } from "../domain/client";

type BillingField = Extract<
  ClientField,
  "address" | "state" | "country" | "gstin"
>;

/**
 * Billing details for invoices: address, state (for GST's place of
 * supply), country (outside India → an export invoice) and GSTIN.
 */
export function BillingFields({
  uid,
  values,
  setValue,
  touch,
  errorFor,
  seller,
  who,
}: {
  /** Your GSTIN and state (Settings → Invoices & GST), for the outcome line. */
  seller: Pick<InvoicingSettings, "gstin" | "state">;
  /** The client's first name, or "this client". */
  who: string;
  uid: string;
  values: Record<BillingField, string>;
  setValue: (name: BillingField, value: string) => void;
  touch: (name: string) => void;
  errorFor: (name: string) => string | undefined;
}) {
  const inIndia = isIndia(values.country);
  // A valid GSTIN decides the state (as it will on the invoice): show it.
  const gstin = values.gstin.trim();
  const fromGstin = isGstinFormat(gstin) ? gstinState(gstin) : null;
  const outcome = gstOutcome(
    seller,
    {
      state: fromGstin ?? ((values.state || null) as StateCode | null),
      country: values.country.trim() || null,
      gstin: fromGstin ? gstin : null,
    },
    who,
  );
  return (
    <fieldset className="grid gap-5 rounded-lg border p-4">
      <legend className="px-1 text-sm font-medium">
        For invoices{" "}
        <span className="font-normal text-muted-foreground">(optional)</span>
      </legend>
      <p className="-mt-2 text-sm text-pretty text-muted-foreground">
        Shown under “Billed to” on invoices.
      </p>
      <Field data-invalid={Boolean(errorFor("address")) || undefined}>
        <FieldLabel htmlFor={`${uid}-address`}>Billing address</FieldLabel>
        <Textarea
          id={`${uid}-address`}
          name="address"
          rows={2}
          maxLength={300}
          value={values.address}
          onChange={(e) => setValue("address", e.target.value)}
          onBlur={() => touch("address")}
          placeholder="2nd floor, Mehta House, Linking Road, Bandra West, Mumbai 400050"
        />
        <FieldError>{errorFor("address")}</FieldError>
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(errorFor("country")) || undefined}>
          <FieldLabel htmlFor={`${uid}-country`}>Country</FieldLabel>
          <Input
            id={`${uid}-country`}
            name="country"
            maxLength={60}
            value={values.country}
            onChange={(e) => setValue("country", e.target.value)}
            onBlur={() => touch("country")}
            placeholder="India"
            list={`${uid}-countries`}
          />
          <datalist id={`${uid}-countries`}>
            {[
              "India",
              "United States",
              "United Kingdom",
              "United Arab Emirates",
              "Canada",
              "Australia",
              "Singapore",
              "Germany",
            ].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <FieldError>{errorFor("country")}</FieldError>
        </Field>
        {inIndia ? (
          <Field data-invalid={Boolean(errorFor("state")) || undefined}>
            <FieldLabel htmlFor={`${uid}-state`}>State</FieldLabel>
            {fromGstin && (
              <input type="hidden" name="state" value={fromGstin} />
            )}
            <NativeSelect
              id={`${uid}-state`}
              name={fromGstin ? undefined : "state"}
              value={fromGstin ?? values.state}
              disabled={Boolean(fromGstin)}
              onChange={(e) => setValue("state", e.target.value)}
              className="w-full"
            >
              <option value="">Choose a state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
            {fromGstin && (
              <FieldDescription>
                {stateName(fromGstin)}, from the GSTIN.
              </FieldDescription>
            )}
            <FieldError>{errorFor("state")}</FieldError>
          </Field>
        ) : (
          <input type="hidden" name="state" value="" />
        )}
      </div>
      {inIndia ? (
        <Field data-invalid={Boolean(errorFor("gstin")) || undefined}>
          <FieldLabel htmlFor={`${uid}-gstin`}>Client&apos;s GSTIN</FieldLabel>
          <Input
            id={`${uid}-gstin`}
            name="gstin"
            maxLength={15}
            value={values.gstin}
            onChange={(e) => setValue("gstin", e.target.value.toUpperCase())}
            onBlur={() => touch("gstin")}
            placeholder="27ABCDE1234F1Z5"
            className="font-mono uppercase"
            aria-invalid={Boolean(errorFor("gstin")) || undefined}
          />
          <FieldDescription>
            If they&apos;re GST-registered. Their state is taken from it.
          </FieldDescription>
          <FieldError>{errorFor("gstin")}</FieldError>
        </Field>
      ) : (
        <input type="hidden" name="gstin" value="" />
      )}
      <p
        aria-live="polite"
        className="rounded-md bg-canvas px-3 py-2 text-sm text-pretty"
      >
        {outcome}
      </p>
    </fieldset>
  );
}
