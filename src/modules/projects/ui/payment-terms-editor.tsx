"use client";

import { Plus } from "lucide-react";
import { useId, type Dispatch, type SetStateAction } from "react";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, type Minor } from "@/shared/lib/money";
import type { FormValidation } from "@/shared/lib/use-form-validation";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Field, FieldLabel } from "@/shared/ui/field";
import { FormSection } from "@/shared/ui/page";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import {
  MILESTONE_LIMITS,
  MILESTONE_PRESETS,
  splitByMilestones,
  type BillingModel,
} from "../domain/billing";
import { MilestoneRowInput } from "./milestone-row-input";
import { rowKey } from "./row-key";

export type MilestoneRow = {
  key: string;
  id?: string;
  name: string;
  percent: string;
};

export const toMilestoneRows = (
  milestones: { id?: string; name: string; percent: string | number }[],
): MilestoneRow[] =>
  milestones.map((m) => ({
    id: m.id,
    name: m.name,
    percent: String(m.percent),
    key: rowKey(),
  }));

/**
 * How the client pays: upfront, or milestones that must add up to 100%
 * (quick splits like 30/30/40), with each payment's amount shown live.
 */
export function PaymentTermsEditor({
  billingModel,
  setBillingModel,
  milestones,
  setMilestones,
  total,
  currency,
  form,
}: {
  billingModel: BillingModel;
  setBillingModel: (model: BillingModel) => void;
  milestones: MilestoneRow[];
  setMilestones: Dispatch<SetStateAction<MilestoneRow[]>>;
  total: Minor;
  currency: CurrencyCode;
  form: FormValidation;
}) {
  const uid = useId();
  const err = (path: string, touchKey?: string) =>
    form.errorFor(path, touchKey);
  const money = (amount: Minor) => formatMoney(amount, currency);
  const percents = milestones.map((m) => Number(m.percent));
  const percentsValid = percents.every((p) => Number.isInteger(p) && p > 0);
  const percentSum = percents.reduce(
    (sum, p) => sum + (Number.isFinite(p) ? p : 0),
    0,
  );
  const amounts =
    percentsValid && percentSum === 100 && total > 0
      ? splitByMilestones(
          total,
          percents.map((percent) => ({ percent })),
        )
      : null;
  const activePreset = MILESTONE_PRESETS.find(
    (preset) =>
      preset.milestones.length === milestones.length &&
      preset.milestones.every((m, i) => m.percent === percents[i]),
  );
  const updateMilestone = (key: string, patch: Partial<MilestoneRow>) =>
    setMilestones((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  return (
    <FormSection
      title="Payment terms"
      description="How the client pays for the agreed scope. Extra work gets its own terms on each change request."
    >
      <div className="grid gap-5">
        <RadioGroup
          name="billingModel"
          value={billingModel}
          onValueChange={(value) => setBillingModel(value as BillingModel)}
          className="grid gap-2 sm:grid-cols-2"
        >
          {(
            [
              {
                value: "upfront",
                title: "Full payment upfront",
                detail: "One payment before you start",
              },
              {
                value: "milestones",
                title: "In milestones",
                detail: "Split across stages, like 30/30/40",
              },
            ] as const
          ).map((option) => (
            <FieldLabel
              key={option.value}
              htmlFor={`${uid}-billing-${option.value}`}
              className="has-data-checked:border-brand/45 has-data-checked:bg-success-soft/70"
            >
              <Field orientation="horizontal">
                <div className="grid flex-1 gap-0.5">
                  <span className="text-sm font-medium">{option.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {option.detail}
                  </span>
                </div>
                <RadioGroupItem
                  value={option.value}
                  id={`${uid}-billing-${option.value}`}
                />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>

        {billingModel === "upfront" && (
          <p className="text-sm text-muted-foreground">
            The client pays{" "}
            <span className="font-medium text-foreground tabular-nums">
              {money(total)}
            </span>{" "}
            before work starts.
          </p>
        )}

        {billingModel === "milestones" && (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Quick split:
              </span>
              {MILESTONE_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  size="sm"
                  variant={
                    activePreset?.id === preset.id ? "default" : "outline"
                  }
                  aria-pressed={activePreset?.id === preset.id}
                  onClick={() =>
                    setMilestones(toMilestoneRows(preset.milestones))
                  }
                  className="tabular-nums"
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <ol className="grid gap-2">
              {milestones.map((milestone, index) => (
                <MilestoneRowInput
                  key={milestone.key}
                  milestone={milestone}
                  index={index}
                  amount={amounts?.[index]}
                  money={money}
                  canRemove={milestones.length > MILESTONE_LIMITS.min}
                  onChange={(patch, field) => {
                    updateMilestone(milestone.key, patch);
                    form.edited(`milestones.${index}.${field}`);
                  }}
                  onRemove={() =>
                    setMilestones((rows) =>
                      rows.filter((row) => row.key !== milestone.key),
                    )
                  }
                  form={form}
                />
              ))}
            </ol>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={milestones.length >= MILESTONE_LIMITS.max}
                onClick={() =>
                  setMilestones((rows) => [
                    ...rows,
                    { key: rowKey(), name: "", percent: "" },
                  ])
                }
              >
                <Plus aria-hidden />
                Add a payment
              </Button>
              <p
                aria-live="polite"
                className={cn(
                  "text-sm tabular-nums",
                  percentSum === 100
                    ? "text-brand"
                    : form.submitted
                      ? "text-destructive"
                      : "text-warning",
                )}
              >
                {percentSum === 100
                  ? "Adds up to 100%"
                  : percentSum < 100
                    ? `Adds up to ${percentSum}%. ${100 - percentSum}% still to assign.`
                    : `Adds up to ${percentSum}%. Remove ${percentSum - 100}%.`}
              </p>
            </div>
            {/* Row problems show on their rows and the 100% rule on the
                line above; this only covers anything else (e.g. too few
                payments). */}
            {err("milestones") &&
              percentSum === 100 &&
              !Object.keys(form.errors).some((k) =>
                k.startsWith("milestones."),
              ) && (
                <p role="alert" className="text-sm text-destructive">
                  {err("milestones")}
                </p>
              )}
          </div>
        )}
      </div>
    </FormSection>
  );
}
