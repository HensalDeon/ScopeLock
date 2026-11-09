"use client";

import { Plus, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, type Minor } from "@/shared/lib/money";
import type { FormValidation } from "@/shared/lib/use-form-validation";
import { GstTotalNote } from "@/modules/invoices";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { MoneyInput } from "@/shared/ui/money-input";
import { FormSection } from "@/shared/ui/page";
import { Textarea } from "@/shared/ui/textarea";
import { CHANGE_LIMITS } from "../domain/change-request";
import { type ChangeFormValues } from "../domain/form-values";

export type ChangeRow = ChangeFormValues["items"][number] & {
  key: string;
  showNote: boolean;
};

let counter = 0;
const rowKey = () => `cr-row-${++counter}`;

export const toChangeRows = (items: ChangeFormValues["items"]): ChangeRow[] =>
  (items.length ? items : [{ title: "", description: "", amount: "" }]).map(
    (item) => ({
      ...item,
      key: rowKey(),
      showNote: Boolean(item.description),
    }),
  );

/** The change's priced lines with a live total. */
export function ChangeLinesEditor({
  rows,
  setRows,
  total,
  currency,
  gstPercent,
  form,
}: {
  rows: ChangeRow[];
  setRows: Dispatch<SetStateAction<ChangeRow[]>>;
  total: Minor;
  currency: CurrencyCode;
  gstPercent: number | null;
  form: FormValidation;
}) {
  const updateRow = (key: string, patch: Partial<ChangeRow>) =>
    setRows((list) =>
      list.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );

  return (
    <FormSection
      title="Price"
      description={
        gstPercent
          ? "One line per piece of work. Your client approves this total, plus GST."
          : "One line per piece of work. The total is what your client approves."
      }
    >
      <div className="grid gap-3">
        <ol className="grid gap-3">
          {rows.map((row, index) => {
            const titleError = form.errorFor(
              `items.${index}.title`,
              `${row.key}.title`,
            );
            const amountError = form.errorFor(
              `items.${index}.amount`,
              `${row.key}.amount`,
            );
            const noteError = form.errorFor(
              `items.${index}.description`,
              `${row.key}.description`,
            );
            return (
              <li key={row.key} className="rounded-lg border bg-background p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_2.25rem] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_9.5rem_2.25rem]">
                  <Input
                    aria-label={`Line ${index + 1}`}
                    placeholder={index === 0 ? "Blog with categories" : "Work"}
                    value={row.title}
                    maxLength={CHANGE_LIMITS.itemTitle}
                    onChange={(e) => {
                      updateRow(row.key, { title: e.target.value });
                      form.edited(`items.${index}.title`);
                    }}
                    onBlur={() => form.touch(`${row.key}.title`)}
                    aria-invalid={Boolean(titleError) || undefined}
                    className="col-start-1 row-start-1 h-9"
                  />
                  <MoneyInput
                    currency={currency}
                    wrapperClassName="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1"
                    aria-label={`Amount for line ${index + 1}, in ${currency}`}
                    value={row.amount}
                    onChange={(e) => {
                      updateRow(row.key, { amount: e.target.value });
                      form.edited(`items.${index}.amount`);
                    }}
                    onBlur={() => form.touch(`${row.key}.amount`)}
                    aria-invalid={Boolean(amountError) || undefined}
                    className="h-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-start-2 row-start-1 size-9 text-muted-foreground sm:col-start-3"
                    disabled={rows.length === 1}
                    onClick={() =>
                      setRows((list) => list.filter((r) => r.key !== row.key))
                    }
                    aria-label={`Remove line ${index + 1}`}
                  >
                    <X aria-hidden />
                  </Button>
                </div>
                {(titleError || amountError) && (
                  <p role="alert" className="mt-2 text-sm text-destructive">
                    {[titleError, amountError].filter(Boolean).join(" ")}
                  </p>
                )}
                {row.showNote ? (
                  <>
                    <Textarea
                      aria-label={`Note for line ${index + 1}`}
                      placeholder="A sentence about this work"
                      rows={2}
                      value={row.description}
                      maxLength={CHANGE_LIMITS.itemDescription}
                      onChange={(e) => {
                        updateRow(row.key, { description: e.target.value });
                        form.edited(`items.${index}.description`);
                      }}
                      onBlur={() => form.touch(`${row.key}.description`)}
                      aria-invalid={Boolean(noteError) || undefined}
                      className="mt-2"
                    />
                    {noteError && (
                      <p className="mt-1 text-sm text-destructive">
                        {noteError}
                      </p>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    className="mt-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    onClick={() => updateRow(row.key, { showNote: true })}
                  >
                    Add a note
                  </button>
                )}
              </li>
            );
          })}
        </ol>
        {form.errorFor("items") &&
          !Object.keys(form.errors).some((k) => k.startsWith("items.")) && (
            <p className="text-sm text-destructive">{form.errorFor("items")}</p>
          )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={rows.length >= CHANGE_LIMITS.maxItems}
            onClick={() =>
              setRows((list) => [
                ...list,
                {
                  key: rowKey(),
                  title: "",
                  description: "",
                  amount: "",
                  showNote: false,
                },
              ])
            }
          >
            <Plus aria-hidden />
            Add a line
          </Button>
          <p className="text-[15px]">
            <span className="text-muted-foreground">Total </span>
            <span className="font-semibold tabular-nums">
              {formatMoney(total, currency)}
            </span>
          </p>
        </div>
        <div className="flex justify-end">
          <GstTotalNote
            amount={total}
            percent={gstPercent}
            currency={currency}
          />
        </div>
      </div>
    </FormSection>
  );
}
