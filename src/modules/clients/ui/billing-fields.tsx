"use client";

import { INDIAN_STATES, isIndia } from "@/shared/lib/india";
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
}: {
  uid: string;
  values: Record<BillingField, string>;
  setValue: (name: BillingField, value: string) => void;
  touch: (name: string) => void;
  errorFor: (name: string) => string | undefined;
}) {
  const inIndia = isIndia(values.country);
  return (
    <fieldset className="grid gap-5 rounded-lg border p-4">
      <legend className="px-1 text-sm font-medium">
        For invoices{" "}
        <span className="font-normal text-muted-foreground">(optional)</span>
      </legend>
      <p className="-mt-2 text-sm text-pretty text-muted-foreground">
        Shown under “Billed to”. If you charge GST, the state decides CGST +
        SGST or IGST, and a client outside India gets an export invoice.
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
            <NativeSelect
              id={`${uid}-state`}
              name="state"
              value={values.state}
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
    </fieldset>
  );
}
