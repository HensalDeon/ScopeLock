"use client";

import { Plus, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, type Minor } from "@/shared/lib/money";
import type { FormValidation } from "@/shared/lib/use-form-validation";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { MoneyInput } from "@/shared/ui/money-input";
import { FormSection } from "@/shared/ui/page";
import { Textarea } from "@/shared/ui/textarea";
import { SCOPE_LIMITS } from "../domain/scope";
import { rowKey } from "./row-key";

export type ItemRow = {
  key: string;
  id?: string;
  title: string;
  description: string;
  /** "What's included" bullet points, one per line. */
  includes: string;
  amount: string;
  showNote: boolean;
  showIncludes: boolean;
};

export const toItemRows = (
  items: {
    id?: string;
    title: string;
    description: string;
    includes: string;
    amount: string;
  }[],
): ItemRow[] =>
  (items.length
    ? items
    : [{ title: "", description: "", includes: "", amount: "" }]
  ).map((item) => ({
    ...item,
    key: rowKey(),
    showNote: Boolean(item.description),
    showIncludes: Boolean(item.includes),
  }));

/**
 * The scope lines: deliverable, amount, optional note and bullet points,
 * with a live total. Rows are the form's state; errors use dotted paths
 * ("items.0.amount") and "touched" uses each row's key.
 */
export function ScopeLinesEditor({
  items,
  setItems,
  total,
  currency,
  form,
}: {
  items: ItemRow[];
  setItems: Dispatch<SetStateAction<ItemRow[]>>;
  total: Minor;
  currency: CurrencyCode;
  form: FormValidation;
}) {
  const err = (path: string, touchKey?: string) =>
    form.errorFor(path, touchKey);
  const money = (amount: Minor) => formatMoney(amount, currency);
  const updateItem = (key: string, patch: Partial<ItemRow>) =>
    setItems((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  return (
    <FormSection
      title="What's included"
      description="List every deliverable and its price. Anything not on this list becomes a change request later."
    >
      <div className="grid gap-3">
        <ol className="grid gap-3">
          {items.map((item, index) => {
            const titleError = err(`items.${index}.title`, `${item.key}.title`);
            const amountError = err(
              `items.${index}.amount`,
              `${item.key}.amount`,
            );
            const includesError = err(
              `items.${index}.includes`,
              `${item.key}.includes`,
            );
            const noteError = err(
              `items.${index}.description`,
              `${item.key}.description`,
            );
            return (
              <li
                key={item.key}
                className="rounded-lg border bg-background p-3"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_2.25rem] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_9.5rem_2.25rem]">
                  <Input
                    aria-label={`Deliverable ${index + 1}`}
                    placeholder={index === 0 ? "Home page" : "Deliverable"}
                    value={item.title}
                    maxLength={SCOPE_LIMITS.titleMax}
                    onChange={(e) => {
                      updateItem(item.key, { title: e.target.value });
                      form.edited(`items.${index}.title`);
                    }}
                    onBlur={() => form.touch(`${item.key}.title`)}
                    aria-invalid={Boolean(titleError) || undefined}
                    className="col-start-1 row-start-1 h-9"
                  />
                  <MoneyInput
                    currency={currency}
                    wrapperClassName="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1"
                    aria-label={`Amount for deliverable ${index + 1}, in ${currency}`}
                    value={item.amount}
                    onChange={(e) => {
                      updateItem(item.key, { amount: e.target.value });
                      form.edited(`items.${index}.amount`);
                    }}
                    onBlur={() => form.touch(`${item.key}.amount`)}
                    aria-invalid={Boolean(amountError) || undefined}
                    className="h-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-start-2 row-start-1 size-9 text-muted-foreground sm:col-start-3"
                    disabled={items.length === 1}
                    onClick={() =>
                      setItems((rows) =>
                        rows.filter((row) => row.key !== item.key),
                      )
                    }
                    aria-label={`Remove deliverable ${index + 1}`}
                  >
                    <X aria-hidden />
                  </Button>
                </div>
                {(titleError || amountError) && (
                  <p role="alert" className="mt-2 text-sm text-destructive">
                    {titleError ?? amountError}
                  </p>
                )}
                {item.showNote && (
                  <Textarea
                    aria-label={`Note for deliverable ${index + 1}`}
                    placeholder="A sentence about this deliverable"
                    rows={2}
                    value={item.description}
                    maxLength={SCOPE_LIMITS.descriptionMax}
                    onChange={(e) => {
                      updateItem(item.key, { description: e.target.value });
                      form.edited(`items.${index}.description`);
                    }}
                    onBlur={() => form.touch(`${item.key}.description`)}
                    aria-invalid={Boolean(noteError) || undefined}
                    className="mt-2"
                  />
                )}
                {noteError && (
                  <p role="alert" className="mt-1 text-sm text-destructive">
                    {noteError}
                  </p>
                )}
                {item.showIncludes && (
                  <>
                    <Textarea
                      aria-label={`What's included in deliverable ${index + 1}, one per line`}
                      placeholder={
                        "Hero with call to action\nServices highlight\nTestimonials"
                      }
                      rows={3}
                      value={item.includes}
                      onChange={(e) => {
                        updateItem(item.key, { includes: e.target.value });
                        form.edited(`items.${index}.includes`);
                      }}
                      onBlur={() => form.touch(`${item.key}.includes`)}
                      aria-invalid={Boolean(includesError) || undefined}
                      className="mt-2"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      One point per line. Shown as a checklist under this line.
                    </p>
                  </>
                )}
                {includesError && (
                  <p role="alert" className="mt-1 text-sm text-destructive">
                    {includesError}
                  </p>
                )}
                {(!item.showNote || !item.showIncludes) && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {!item.showNote && (
                      <button
                        type="button"
                        onClick={() => updateItem(item.key, { showNote: true })}
                        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        Add a note
                      </button>
                    )}
                    {!item.showIncludes && (
                      <button
                        type="button"
                        onClick={() =>
                          updateItem(item.key, { showIncludes: true })
                        }
                        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        Add bullet points
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {err("items") &&
          !Object.keys(form.errors).some((k) => k.startsWith("items.")) && (
            <p role="alert" className="text-sm text-destructive">
              {err("items")}
            </p>
          )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={items.length >= SCOPE_LIMITS.maxItems}
            onClick={() =>
              setItems((rows) => [
                ...rows,
                {
                  key: rowKey(),
                  title: "",
                  description: "",
                  includes: "",
                  amount: "",
                  showNote: false,
                  showIncludes: false,
                },
              ])
            }
          >
            <Plus aria-hidden />
            Add a line
          </Button>
          <p className="text-sm">
            <span className="text-muted-foreground">Total </span>
            <span
              className="text-lg font-semibold tabular-nums"
              aria-live="polite"
            >
              {money(total)}
            </span>
          </p>
        </div>
      </div>
    </FormSection>
  );
}
