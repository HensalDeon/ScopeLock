"use client";

import { useActionState, useId, useRef, useState, useTransition } from "react";
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
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { useUnsavedGuard } from "@/shared/ui/use-unsaved-guard";
import { Textarea } from "@/shared/ui/textarea";
import {
  defaultsToFormValues,
  proposalDefaultsSchema,
  type ProposalDefaults,
  type ProposalDefaultsField,
} from "../domain/defaults";
import {
  updateProposalDefaults,
  type ProposalDefaultsFormState,
} from "../server/actions";

const FIELDS: { name: ProposalDefaultsField; label: string; hint: string }[] = [
  {
    name: "terms",
    label: "Terms",
    hint: "Validity, revisions, when work starts, how extra work is handled.",
  },
  {
    name: "exclusions",
    label: "Not included",
    hint: "Spelling this out up front is the best protection against “but I thought that was included”.",
  },
  {
    name: "clientProvides",
    label: "What you need from the client",
    hint: "Logo, content, photos, feedback times.",
  },
];

/** Default text pre-filled into every new project's proposal. */
export function ProposalDefaultsForm({
  initial,
}: {
  initial: ProposalDefaults;
}) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<
    ProposalDefaultsFormState,
    FormData
  >(updateProposalDefaults, IDLE);
  const [, startTransition] = useTransition();
  const saved = defaultsToFormValues(initial);
  const [values, setValues] = useState(saved);
  const form = useFormValidation(proposalDefaultsSchema, values, {
    initial: saved,
    serverState: state,
  });
  useUnsavedGuard(form.isDirty && !pending);

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.markSubmitted()) {
          focusFirstInvalid(formRef.current);
          return;
        }
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <FieldGroup className="gap-6">
        {state.status === "error" && state.message && (
          <FormAlert>{state.message}</FormAlert>
        )}
        {FIELDS.map((field) => (
          <Field
            key={field.name}
            data-invalid={Boolean(form.errorFor(field.name)) || undefined}
          >
            <FieldLabel htmlFor={`${uid}-${field.name}`}>
              {field.label}
            </FieldLabel>
            <Textarea
              id={`${uid}-${field.name}`}
              name={field.name}
              // Tall enough for the starting text without scrolling.
              rows={Math.max(5, values[field.name].split("\n").length + 2)}
              value={values[field.name]}
              onChange={(e) => {
                setValues((v) => ({ ...v, [field.name]: e.target.value }));
                form.edited(field.name);
              }}
              onBlur={() => form.touch(field.name)}
              aria-invalid={Boolean(form.errorFor(field.name)) || undefined}
            />
            <FieldDescription>One per line. {field.hint}</FieldDescription>
            {form.errorFor(field.name) && (
              <FieldError>{form.errorFor(field.name)}</FieldError>
            )}
          </Field>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant={form.isDirty ? "default" : "outline"}
            disabled={pending || !form.isDirty}
          >
            {pending ? "Saving…" : "Save defaults"}
          </Button>
          {!pending && !form.isDirty && (
            <p role="status" className="text-sm text-muted-foreground">
              {state.status === "success"
                ? state.message
                : "Matches what new projects get"}
            </p>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}
