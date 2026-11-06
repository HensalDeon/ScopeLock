"use client";

import { Plus, X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useActionState, useId, useRef, useState, useTransition } from "react";
import { draftTotal } from "@/shared/lib/amount-field";
import type { CurrencyCode } from "@/shared/lib/currency";
import { IDLE } from "@/shared/lib/form-state";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import {
  focusFirstInvalid,
  useFormValidation,
} from "@/shared/lib/use-form-validation";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { Input } from "@/shared/ui/input";
import { MoneyInput } from "@/shared/ui/money-input";
import { FormSection } from "@/shared/ui/page";
import { NativeSelect } from "@/shared/ui/native-select";
import { Textarea } from "@/shared/ui/textarea";
import {
  CHANGE_LIMITS,
  changeInputSchema,
  SOURCE_CHANNELS,
  SOURCE_LABELS,
  type BillingOption,
  type ChangeFormValues,
} from "../domain/change-request";
import {
  createChange,
  updateChange,
  type ChangeFormState,
} from "../server/actions";

type Row = ChangeFormValues["items"][number] & {
  key: string;
  showNote: boolean;
};
let counter = 0;
const rowKey = () => `cr-row-${++counter}`;
const toRows = (items: ChangeFormValues["items"]): Row[] =>
  (items.length ? items : [{ title: "", description: "", amount: "" }]).map(
    (item) => ({ ...item, key: rowKey(), showNote: Boolean(item.description) }),
  );

/**
 * Create or edit a change request (drafts only). Same live validation as
 * every other form; the server re-checks everything.
 */
export function ChangeForm({
  mode,
  projectId,
  number,
  currency,
  milestones,
  defaults,
  cancelHref,
}: {
  mode: "create" | "edit";
  projectId: string;
  number?: number;
  currency: CurrencyCode;
  /** The project's payments, in order. One entry for upfront billing. */
  milestones: { id: string; name: string }[];
  defaults: ChangeFormValues;
  cancelHref: Route;
}) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ChangeFormState, FormData>(
    mode === "create" ? createChange : updateChange,
    IDLE,
  );
  const [, startTransition] = useTransition();
  const [rows, setRows] = useState(() => toRows(defaults.items));
  const [values, setValues] = useState({
    title: defaults.title,
    description: defaults.description,
    billingOption: defaults.billingOption,
    milestoneId: defaults.milestoneId,
    sourceChannel: defaults.sourceChannel,
    sourceNote: defaults.sourceNote,
  });
  const itemsJson = JSON.stringify(
    rows.map(({ id, title, description, amount }) => ({
      id,
      title,
      description,
      amount,
    })),
  );
  const all = { ...values, items: itemsJson };
  const [initial] = useState(() => ({
    ...all,
    items: JSON.stringify(
      toRows(defaults.items).map(({ id, title, description, amount }) => ({
        id,
        title,
        description,
        amount,
      })),
    ),
  }));
  const form = useFormValidation(changeInputSchema, all, {
    initial: mode === "edit" ? initial : undefined,
    serverState: state,
  });
  const total = draftTotal(rows.map((r) => r.amount));
  const single = milestones.length <= 1;
  const last = milestones.at(-1);

  const set = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) => {
    setValues((v) => ({ ...v, [key]: value }));
    form.edited(key);
  };
  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((list) =>
      list.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );

  const options: { value: BillingOption; label: string; detail: string }[] =
    single
      ? [
          {
            value: "pay_now",
            label: "Ask for it as a separate payment",
            detail: "Due once your client approves it.",
          },
          {
            value: "final",
            label: "Add it to the full payment",
            detail: "Only if the full payment hasn't been paid yet.",
          },
        ]
      : [
          {
            value: "final",
            label: "Add to the final payment",
            detail: last ? `Goes on “${last.name}”.` : "",
          },
          {
            value: "next_milestone",
            label: "Add to the next payment due",
            detail: "The next payment that hasn't been paid.",
          },
          {
            value: "split",
            label: "Split across the remaining payments",
            detail: "In the same proportions as the payment schedule.",
          },
          {
            value: "milestone",
            label: "Add to a specific payment",
            detail: "Choose which one below.",
          },
          {
            value: "pay_now",
            label: "Ask for it as a separate payment",
            detail: "Due once your client approves it.",
          },
        ];

  return (
    <form
      ref={formRef}
      noValidate
      className="grid gap-10"
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.markSubmitted()) {
          focusFirstInvalid(formRef.current);
          return;
        }
        startTransition(() => action(new FormData(event.currentTarget)));
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />
      {number !== undefined && (
        <input type="hidden" name="number" value={number} />
      )}
      <input type="hidden" name="items" value={itemsJson} />
      <input type="hidden" name="billingOption" value={values.billingOption} />

      {state.status === "error" && state.message && (
        <FormAlert>{state.message}</FormAlert>
      )}

      <FormSection
        title="The change"
        description="Your client sees the name and description on the change request."
      >
        <div className="grid gap-5">
          <Field data-invalid={Boolean(form.errorFor("title")) || undefined}>
            <FieldLabel htmlFor={`${uid}-title`}>Name</FieldLabel>
            <Input
              id={`${uid}-title`}
              name="title"
              value={values.title}
              maxLength={CHANGE_LIMITS.title}
              placeholder="Blog + WhatsApp chat button"
              onChange={(e) => set("title", e.target.value)}
              onBlur={() => form.touch("title")}
              aria-invalid={Boolean(form.errorFor("title")) || undefined}
              autoFocus={mode === "create" && !values.title}
            />
            <FieldError>{form.errorFor("title")}</FieldError>
          </Field>
          <Field
            data-invalid={Boolean(form.errorFor("description")) || undefined}
          >
            <FieldLabel htmlFor={`${uid}-description`}>
              What&apos;s changing (optional)
            </FieldLabel>
            <Textarea
              id={`${uid}-description`}
              name="description"
              rows={3}
              value={values.description}
              maxLength={CHANGE_LIMITS.description}
              placeholder="You asked for a blog with categories and a WhatsApp button on every page. Here's what that adds."
              onChange={(e) => set("description", e.target.value)}
              onBlur={() => form.touch("description")}
              aria-invalid={Boolean(form.errorFor("description")) || undefined}
            />
            <FieldError>{form.errorFor("description")}</FieldError>
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Price"
        description="One line per piece of work. The total is what your client approves."
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
                <li
                  key={row.key}
                  className="rounded-lg border bg-background p-3"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_2.25rem] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_9.5rem_2.25rem]">
                    <Input
                      aria-label={`Line ${index + 1}`}
                      placeholder={
                        index === 0 ? "Blog with categories" : "Work"
                      }
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
                      {titleError ?? amountError}
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
              <p className="text-sm text-destructive">
                {form.errorFor("items")}
              </p>
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
        </div>
      </FormSection>

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
                onChange={() => set("billingOption", option.value)}
                className="mt-1 accent-(--color-primary)"
              />
              <span className="grid gap-0.5">
                <span className="text-[15px] font-medium">{option.label}</span>
                {option.detail && (
                  <span className="text-sm text-muted-foreground">
                    {option.detail}
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
                onChange={(e) => set("milestoneId", e.target.value)}
                onBlur={() => form.touch("milestoneId")}
                aria-invalid={
                  Boolean(form.errorFor("milestoneId")) || undefined
                }
                className="w-full sm:w-72"
              >
                <option value="">Choose a payment</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </NativeSelect>
              <FieldError>{form.errorFor("milestoneId")}</FieldError>
            </Field>
          )}
          {values.billingOption !== "milestone" && (
            <input type="hidden" name="milestoneId" value="" />
          )}
        </fieldset>
      </FormSection>

      <FormSection
        title="Where it came from"
        description="Only you see this. It helps when you look back at why the price went up."
      >
        <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <Field>
            <FieldLabel htmlFor={`${uid}-channel`}>Asked on</FieldLabel>
            <NativeSelect
              id={`${uid}-channel`}
              name="sourceChannel"
              value={values.sourceChannel}
              onChange={(e) => set("sourceChannel", e.target.value)}
              className="w-full"
            >
              <option value="">Not recorded</option>
              {SOURCE_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {SOURCE_LABELS[c]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field
            data-invalid={Boolean(form.errorFor("sourceNote")) || undefined}
          >
            <FieldLabel htmlFor={`${uid}-note`}>Note</FieldLabel>
            <Input
              id={`${uid}-note`}
              name="sourceNote"
              value={values.sourceNote}
              maxLength={CHANGE_LIMITS.sourceNote}
              placeholder="Rahul asked on WhatsApp, 3 Nov"
              onChange={(e) => set("sourceNote", e.target.value)}
              onBlur={() => form.touch("sourceNote")}
              aria-invalid={Boolean(form.errorFor("sourceNote")) || undefined}
            />
            <FieldError>{form.errorFor("sourceNote")}</FieldError>
          </Field>
        </div>
      </FormSection>

      <div className="flex flex-wrap items-center gap-3 border-t pt-6">
        <Button
          type="submit"
          size="lg"
          disabled={pending || (mode === "edit" && !form.isDirty)}
        >
          {mode === "create"
            ? pending
              ? "Saving draft…"
              : "Save draft"
            : pending
              ? "Saving…"
              : "Save changes"}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <FieldDescription>
          {mode === "edit" && !form.isDirty
            ? "No changes yet."
            : "Your client sees nothing until you send it."}
        </FieldDescription>
      </div>
    </form>
  );
}
