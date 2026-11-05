"use client";

import {
  BUSINESS_NAME_MAX_LENGTH,
  BUSINESS_TYPE_LABELS,
  BUSINESS_TYPES,
  type BusinessType,
} from "../domain/workspace";
import type { WorkspaceFormState } from "../server/actions";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

/** Business name, how you work, WhatsApp number — shared by onboarding and settings. */
export function WorkspaceFields({
  state,
  businessName,
  onBusinessNameChange,
  defaults,
}: {
  state: WorkspaceFormState;
  businessName: string;
  onBusinessNameChange: (value: string) => void;
  defaults: { businessType?: BusinessType | ""; phone?: string };
}) {
  const errors = (state.status === "error" && state.fieldErrors) || {};
  const typed = state.status === "idle" ? undefined : state.values;
  const businessType = typed?.businessType ?? defaults.businessType ?? "";
  const phone = typed?.phone ?? defaults.phone ?? "";

  return (
    <>
      <Field data-invalid={Boolean(errors.businessName) || undefined}>
        <FieldLabel htmlFor="businessName">Business name</FieldLabel>
        <Input
          id="businessName"
          name="businessName"
          autoComplete="organization"
          value={businessName}
          onChange={(e) => onBusinessNameChange(e.target.value)}
          aria-invalid={Boolean(errors.businessName) || undefined}
          maxLength={BUSINESS_NAME_MAX_LENGTH}
          required
        />
        <FieldDescription>
          Use your studio&apos;s name, or your own if you work under it.
        </FieldDescription>
        {errors.businessName && <FieldError>{errors.businessName}</FieldError>}
      </Field>

      <FieldSet data-invalid={Boolean(errors.businessType) || undefined}>
        <FieldLegend variant="label">How do you work?</FieldLegend>
        <RadioGroup
          name="businessType"
          defaultValue={businessType}
          className="grid gap-2 sm:grid-cols-3"
          aria-invalid={Boolean(errors.businessType) || undefined}
          // Remount when the server echoes a different value back.
          key={businessType}
        >
          {BUSINESS_TYPES.map((type) => (
            <FieldLabel
              key={type}
              htmlFor={`type-${type}`}
              className="has-data-checked:border-brand/45 has-data-checked:bg-success-soft/70"
            >
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>{BUSINESS_TYPE_LABELS[type].title}</FieldTitle>
                  <FieldDescription>
                    {BUSINESS_TYPE_LABELS[type].detail}
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value={type} id={`type-${type}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        {errors.businessType && <FieldError>{errors.businessType}</FieldError>}
      </FieldSet>

      <Field data-invalid={Boolean(errors.phone) || undefined}>
        <FieldLabel htmlFor="phone">
          WhatsApp number{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          defaultValue={phone}
          key={phone}
          aria-invalid={Boolean(errors.phone) || undefined}
        />
        <FieldDescription>
          Shown on approval pages so clients can reach you.
        </FieldDescription>
        {errors.phone && <FieldError>{errors.phone}</FieldError>}
      </Field>
    </>
  );
}
