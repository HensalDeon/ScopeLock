"use client";

import {
  gstOutcome,
  taxCaseOf,
  type InvoicingSettings,
} from "@/modules/invoices";
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
  saved = null,
  billsInRupees,
}: {
  /** Editing: the details as saved, to flag a change in how GST applies. */
  saved?: Record<BillingField, string> | null;
  /** New projects for this client would be in INR. */
  billsInRupees: boolean;
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
  const fromGstin = stateFromGstin(values.gstin);
  const outcome = outcomeFor(seller, values, who);
  const savedOutcome = saved ? outcomeFor(seller, saved, who) : null;
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
      {!isIndia(values.country) && /\b\d{6}\b/.test(values.address) && (
        <p className="rounded-md bg-warning-soft px-3 py-2 text-sm text-pretty text-warning-ink">
          This address has an Indian PIN code, but {who} is in{" "}
          {values.country.trim()}. Invoices print it under &ldquo;Billed
          to&rdquo;, so update it to their address there.
        </p>
      )}
      {savedOutcome && savedOutcome !== outcome && (
        <p className="rounded-md bg-warning-soft px-3 py-2 text-sm text-pretty text-warning-ink">
          This changes how future invoices to {who} are taxed. Invoices already
          issued stay as they are; to correct an unpaid one, cancel that payment
          request and ask again. If they moved, update their billing address
          too.
        </p>
      )}
      {billsInRupees &&
        taxCaseOf(seller, { country: values.country.trim() || null }) ===
          "export" && (
          <p className="rounded-md bg-warning-soft px-3 py-2 text-sm text-pretty text-warning-ink">
            GST law counts this as an export only if you&apos;re paid in foreign
            currency, or in rupees through a bank route the RBI allows. If {who}{" "}
            will pay in rupees by UPI, it may not qualify: consider billing them
            in their own currency.
          </p>
        )}
    </fieldset>
  );
}

/** A valid GSTIN's state (it decides the invoice's place of supply). */
function stateFromGstin(raw: string): StateCode | null {
  const gstin = raw.trim();
  return isGstinFormat(gstin) ? gstinState(gstin) : null;
}

/** What GST invoices to the client carry, for these details. */
function outcomeFor(
  seller: Pick<InvoicingSettings, "gstin" | "state">,
  v: Record<BillingField, string>,
  who: string,
): string {
  const fromGstin = stateFromGstin(v.gstin);
  return gstOutcome(
    seller,
    {
      state: fromGstin ?? ((v.state || null) as StateCode | null),
      country: v.country.trim() || null,
      gstin: fromGstin ? v.gstin.trim() : null,
    },
    who,
  );
}
