"use client";

import { useId } from "react";
import type { FormValidation } from "@/shared/lib/use-form-validation";
import { cn } from "@/shared/lib/utils";
import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import { NativeSelect } from "@/shared/ui/native-select";
import { FormSection } from "@/shared/ui/page";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, type Minor } from "@/shared/lib/money";
import {
  billingChoices,
  billingPreview,
  type BillingContext,
} from "../domain/billing";
import { type BillingOption } from "../domain/change-request";

/** Which payment the change joins (or a separate one), plus the payment picker. */
export function BillingChoice({
  values,
  setBillingOption,
  setMilestoneId,
  milestones,
  form,
  total,
  currency,
  context = null,
}: {
  /** The change's total so far, before GST. */
  total: Minor;
  currency: CurrencyCode;
  /** The schedule as it stands, so each choice can show real amounts. */
  context?: BillingContext | null;
  values: { billingOption: BillingOption; milestoneId: string };
  setBillingOption: (option: BillingOption) => void;
  setMilestoneId: (id: string) => void;
  milestones: { id: string; name: string }[];
  form: FormValidation;
}) {
  const uid = useId();
  const options = billingChoices(milestones);
  const preview = (option: BillingOption) =>
    context
      ? billingPreview(
          total,
          {
            option,
            milestoneId:
              option === "milestone" ? values.milestoneId || null : null,
          },
          context,
          (amount) => formatMoney(amount, currency),
        )
      : null;
  return (
    <FormSection
      title="When it's paid"
      description="Approving and paying are separate. Your client approves now; this says which payment it joins."
    >
      <fieldset className="grid gap-2">
        <legend className="sr-only">When it&apos;s paid</legend>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              values.billingOption === option.value
                ? "border-primary ring-1 ring-primary"
                : "hover:border-foreground/30",
            )}
          >
            <input
              type="radio"
              name={`${uid}-billing`}
              value={option.value}
              checked={values.billingOption === option.value}
              onChange={() => setBillingOption(option.value)}
              className="mt-1 accent-(--color-primary)"
            />
            <span className="grid gap-0.5">
              <span className="text-[15px] font-medium">{option.label}</span>
              {(preview(option.value) ?? option.detail) && (
                <span className="text-sm text-muted-foreground tabular-nums">
                  {preview(option.value) ?? option.detail}
                </span>
              )}
            </span>
          </label>
        ))}
        {values.billingOption === "milestone" && (
          <Field
            data-invalid={Boolean(form.errorFor("milestoneId")) || undefined}
            className="mt-2"
          >
            <FieldLabel htmlFor={`${uid}-milestone`}>Payment</FieldLabel>
            <NativeSelect
              id={`${uid}-milestone`}
              name="milestoneId"
              value={values.milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
              onBlur={() => form.touch("milestoneId")}
              aria-invalid={Boolean(form.errorFor("milestoneId")) || undefined}
              className="w-full sm:w-72"
            >
              <option value="">Choose a payment</option>
              {milestones.map((m) => {
                // Asked for or paid: approval would move it elsewhere.
                const closed = context?.closed[m.id];
                return (
                  <option key={m.id} value={m.id} disabled={Boolean(closed)}>
                    {m.name}
                    {closed === "received"
                      ? " · received"
                      : closed === "asked"
                        ? " · already asked for"
                        : ""}
                  </option>
                );
              })}
            </NativeSelect>
            <FieldError>{form.errorFor("milestoneId")}</FieldError>
          </Field>
        )}
        {values.billingOption !== "milestone" && (
          <input type="hidden" name="milestoneId" value="" />
        )}
      </fieldset>
    </FormSection>
  );
}
