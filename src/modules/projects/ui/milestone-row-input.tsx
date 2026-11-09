"use client";

import { X } from "lucide-react";
import type { Minor } from "@/shared/lib/money";
import type { FormValidation } from "@/shared/lib/use-form-validation";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { MILESTONE_LIMITS } from "../domain/billing";
import type { MilestoneRow } from "./payment-terms-editor";

/** One payment in the milestone list: name, percentage, live amount. */
export function MilestoneRowInput({
  milestone,
  index,
  amount,
  money,
  canRemove,
  onChange,
  onRemove,
  form,
}: {
  milestone: MilestoneRow;
  index: number;
  /** Its share of the total, once the percentages add up. */
  amount: Minor | undefined;
  money: (amount: Minor) => string;
  canRemove: boolean;
  onChange: (
    patch: Partial<Pick<MilestoneRow, "name" | "percent">>,
    field: "name" | "percent",
  ) => void;
  onRemove: () => void;
  form: FormValidation;
}) {
  const nameError = form.errorFor(
    `milestones.${index}.name`,
    `${milestone.key}.name`,
  );
  const percentError = form.errorFor(
    `milestones.${index}.percent`,
    `${milestone.key}.percent`,
  );
  return (
    <li>
      <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_2.25rem] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_5.5rem_7rem_2.25rem]">
        <Input
          aria-label={`Payment ${index + 1} name`}
          value={milestone.name}
          maxLength={MILESTONE_LIMITS.nameMax}
          onChange={(e) => onChange({ name: e.target.value }, "name")}
          onBlur={() => form.touch(`${milestone.key}.name`)}
          aria-invalid={Boolean(nameError) || undefined}
          className="h-9"
        />
        <div className="relative">
          <Input
            aria-label={`Payment ${index + 1} percentage`}
            inputMode="numeric"
            value={milestone.percent}
            onChange={(e) =>
              onChange(
                { percent: e.target.value.replace(/[^\d]/g, "").slice(0, 3) },
                "percent",
              )
            }
            onBlur={() => form.touch(`${milestone.key}.percent`)}
            aria-invalid={Boolean(percentError) || undefined}
            className="h-9 pr-7 text-right tabular-nums"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground"
          >
            %
          </span>
        </div>
        <p className="hidden text-right text-sm tabular-nums sm:block">
          {amount !== undefined && amount > 0 ? money(amount) : null}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground"
          disabled={!canRemove}
          onClick={onRemove}
          aria-label={`Remove payment ${index + 1}`}
        >
          <X aria-hidden />
        </Button>
      </div>
      {amount !== undefined && (
        <p className="mt-1 text-sm text-muted-foreground tabular-nums sm:hidden">
          {money(amount)}
        </p>
      )}
      {(nameError || percentError) && (
        <p role="alert" className="mt-1 text-sm text-destructive">
          {[nameError, percentError].filter(Boolean).join(" ")}
        </p>
      )}
    </li>
  );
}
