"use client";

import { useId } from "react";
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
import {
  BUSINESS_NAME_MAX_LENGTH,
  BUSINESS_TYPE_LABELS,
  BUSINESS_TYPES,
  type WorkspaceField,
} from "../domain/workspace";

export type WorkspaceValues = Record<WorkspaceField, string>;

/**
 * Business name, how you work, WhatsApp number, shared by onboarding and
 * settings. Controlled by the parent form, which owns validation.
 */
export function WorkspaceFields({
  values,
  onChange,
  onBlur,
  errorFor,
}: {
  values: WorkspaceValues;
  onChange: (field: WorkspaceField, value: string) => void;
  onBlur: (field: WorkspaceField) => void;
  errorFor: (field: WorkspaceField) => string | undefined;
}) {
  // Unique per instance: visited pages stay mounted, so two copies of
  // this form can be in the document at once (CONVENTIONS §5).
  const uid = useId();

  return (
    <>
      <Field data-invalid={Boolean(errorFor("businessName")) || undefined}>
        <FieldLabel htmlFor={`${uid}-businessName`}>Business name</FieldLabel>
        <Input
          id={`${uid}-businessName`}
          name="businessName"
          autoComplete="organization"
          value={values.businessName}
          onChange={(e) => onChange("businessName", e.target.value)}
          onBlur={() => onBlur("businessName")}
          aria-invalid={Boolean(errorFor("businessName")) || undefined}
          maxLength={BUSINESS_NAME_MAX_LENGTH}
          required
        />
        <FieldDescription>
          Use your studio&apos;s name, or your own if you work under it.
        </FieldDescription>
        {errorFor("businessName") && (
          <FieldError>{errorFor("businessName")}</FieldError>
        )}
      </Field>

      <FieldSet data-invalid={Boolean(errorFor("businessType")) || undefined}>
        <FieldLegend variant="label">How do you work?</FieldLegend>
        <RadioGroup
          name="businessType"
          value={values.businessType}
          onValueChange={(value) => {
            onChange("businessType", value);
            onBlur("businessType");
          }}
          className="grid gap-2 sm:grid-cols-3"
          aria-invalid={Boolean(errorFor("businessType")) || undefined}
        >
          {BUSINESS_TYPES.map((type) => (
            <FieldLabel
              key={type}
              htmlFor={`${uid}-type-${type}`}
              className="has-data-checked:border-brand/45 has-data-checked:bg-success-soft/70"
            >
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>{BUSINESS_TYPE_LABELS[type].title}</FieldTitle>
                  <FieldDescription>
                    {BUSINESS_TYPE_LABELS[type].detail}
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value={type} id={`${uid}-type-${type}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        {errorFor("businessType") && (
          <FieldError>{errorFor("businessType")}</FieldError>
        )}
      </FieldSet>

      <Field data-invalid={Boolean(errorFor("phone")) || undefined}>
        <FieldLabel htmlFor={`${uid}-phone`}>
          WhatsApp number{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Input
          id={`${uid}-phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          value={values.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          onBlur={() => onBlur("phone")}
          aria-invalid={Boolean(errorFor("phone")) || undefined}
        />
        <FieldDescription>
          Shown on approval pages so clients can reach you.
        </FieldDescription>
        {errorFor("phone") && <FieldError>{errorFor("phone")}</FieldError>}
      </Field>
    </>
  );
}
