"use client";

import type { Route } from "next";
import Link from "next/link";
import { useActionState, useId, useRef, useState, useTransition } from "react";
import { draftTotal } from "@/shared/lib/amount-field";
import type { CurrencyCode } from "@/shared/lib/currency";
import { IDLE } from "@/shared/lib/form-state";
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
import { FormSection } from "@/shared/ui/page";
import { NativeSelect } from "@/shared/ui/native-select";
import { Textarea } from "@/shared/ui/textarea";
import {
  CHANGE_LIMITS,
  changeInputSchema,
  SOURCE_CHANNELS,
  SOURCE_LABELS,
} from "../domain/change-request";
import { type ChangeFormValues } from "../domain/form-values";
import { BillingChoice } from "./billing-choice";
import type { BillingContext } from "../domain/billing";
import { ChangeLinesEditor, toChangeRows } from "./change-lines-editor";
import {
  createChange,
  updateChange,
  type ChangeFormState,
} from "../server/actions";

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
  gstPercent = null,
  billing = null,
}: {
  /** The schedule as it stands, for amounts in "When it's paid". */
  billing?: BillingContext | null;
  /** GST this client's invoices add (18), or null. */
  gstPercent?: number | null;
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
  const [rows, setRows] = useState(() => toChangeRows(defaults.items));
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
      toChangeRows(defaults.items).map(
        ({ id, title, description, amount }) => ({
          id,
          title,
          description,
          amount,
        }),
      ),
    ),
  }));
  const form = useFormValidation(changeInputSchema, all, {
    initial: mode === "edit" ? initial : undefined,
    serverState: state,
  });
  const total = draftTotal(rows.map((r) => r.amount));

  const set = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) => {
    setValues((v) => ({ ...v, [key]: value }));
    form.edited(key);
  };

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

      <ChangeLinesEditor
        rows={rows}
        setRows={setRows}
        total={total}
        currency={currency}
        gstPercent={gstPercent}
        form={form}
      />

      <BillingChoice
        values={values}
        setBillingOption={(option) => set("billingOption", option)}
        setMilestoneId={(id) => set("milestoneId", id)}
        milestones={milestones}
        form={form}
        total={total}
        currency={currency}
        context={billing}
      />

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
              placeholder="Wants it before the Diwali sale"
              onChange={(e) => set("sourceNote", e.target.value)}
              onBlur={() => form.touch("sourceNote")}
              aria-invalid={Boolean(form.errorFor("sourceNote")) || undefined}
            />
            <FieldError>{form.errorFor("sourceNote")}</FieldError>
          </Field>
        </div>
      </FormSection>

      {/* Next to the button that was just tapped: the form is long. */}
      {state.status === "error" && state.message && (
        <FormAlert>{state.message}</FormAlert>
      )}
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
