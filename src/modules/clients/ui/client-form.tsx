"use client";

import type { Route } from "next";
import Link from "next/link";
import { useActionState, useId, useRef, useState, useTransition } from "react";
import { currencyLabel, type CurrencyCode } from "@/shared/lib/currency";
import { IDLE } from "@/shared/lib/form-state";
import {
  focusFirstInvalid,
  useFormValidation,
} from "@/shared/lib/use-form-validation";
import { Button } from "@/shared/ui/button";
import { CurrencySelect } from "@/shared/ui/currency-select";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { Input } from "@/shared/ui/input";
import {
  CLIENT_COMPANY_MAX_LENGTH,
  CLIENT_NAME_MAX_LENGTH,
  clientInputSchema,
  type ClientField,
} from "../domain/client";
import {
  createClient,
  updateClient,
  type ClientFormState,
} from "../server/actions";

type Values = Record<ClientField, string>;
const EMPTY: Values = {
  name: "",
  company: "",
  email: "",
  phone: "",
  currency: "",
};

/**
 * Add or edit a client. Fields are checked as the person goes (same rules as
 * the server). "Add" redirects on success; "edit" stays, shows a saved
 * message, and only enables Save when something actually changed.
 */
export function ClientForm(
  props: (
    | { mode: "create"; next?: string; cancelHref: Route }
    | { mode: "edit"; clientId: string; defaults: Values }
  ) & {
    /** The workspace default, shown as "Use my default (INR)". */
    defaultCurrency: CurrencyCode;
  },
) {
  // Unique per instance: visited pages stay mounted, so two copies of
  // this form can be in the document at once (CONVENTIONS §5).
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ClientFormState, FormData>(
    props.mode === "create" ? createClient : updateClient,
    IDLE,
  );
  const [, startTransition] = useTransition();
  const initial = props.mode === "edit" ? props.defaults : undefined;
  const [values, setValues] = useState<Values>(initial ?? EMPTY);
  const form = useFormValidation(clientInputSchema, values, {
    initial,
    serverState: state,
  });
  const canSave = props.mode === "create" || form.isDirty;

  const field = (name: ClientField) => ({
    id: `${uid}-${name}`,
    name,
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
      form.edited(name);
    },
    onBlur: () => form.touch(name),
    "aria-invalid": Boolean(form.errorFor(name)) || undefined,
  });

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
      {props.mode === "create" ? (
        <input type="hidden" name="next" value={props.next ?? ""} />
      ) : (
        <input type="hidden" name="id" value={props.clientId} />
      )}
      <FieldGroup className="gap-6">
        {state.status === "error" && state.message && (
          <FormAlert>{state.message}</FormAlert>
        )}

        <Field data-invalid={Boolean(form.errorFor("name")) || undefined}>
          <FieldLabel htmlFor={`${uid}-name`}>Client name</FieldLabel>
          <Input
            {...field("name")}
            autoComplete="off"
            maxLength={CLIENT_NAME_MAX_LENGTH}
            autoFocus={props.mode === "create"}
            required
          />
          <FieldDescription>
            The person who approves the work, e.g. Rahul Mehta.
          </FieldDescription>
          {form.errorFor("name") && (
            <FieldError>{form.errorFor("name")}</FieldError>
          )}
        </Field>

        <Field data-invalid={Boolean(form.errorFor("company")) || undefined}>
          <FieldLabel htmlFor={`${uid}-company`}>
            Company{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </FieldLabel>
          <Input
            {...field("company")}
            autoComplete="off"
            maxLength={CLIENT_COMPANY_MAX_LENGTH}
          />
          {form.errorFor("company") && (
            <FieldError>{form.errorFor("company")}</FieldError>
          )}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={Boolean(form.errorFor("phone")) || undefined}>
            <FieldLabel htmlFor={`${uid}-phone`}>
              WhatsApp number{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </FieldLabel>
            <Input
              {...field("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="98765 43210"
            />
            <FieldDescription>For sending approval links.</FieldDescription>
            {form.errorFor("phone") && (
              <FieldError>{form.errorFor("phone")}</FieldError>
            )}
          </Field>

          <Field data-invalid={Boolean(form.errorFor("email")) || undefined}>
            <FieldLabel htmlFor={`${uid}-email`}>
              Email{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </FieldLabel>
            <Input
              {...field("email")}
              type="email"
              inputMode="email"
              autoComplete="off"
            />
            <FieldDescription>For approval receipts.</FieldDescription>
            {form.errorFor("email") && (
              <FieldError>{form.errorFor("email")}</FieldError>
            )}
          </Field>
        </div>

        <Field data-invalid={Boolean(form.errorFor("currency")) || undefined}>
          <FieldLabel htmlFor={`${uid}-currency`}>Bills in</FieldLabel>
          <CurrencySelect
            id={`${uid}-currency`}
            name="currency"
            className="w-full sm:w-72"
            value={values.currency as CurrencyCode | ""}
            defaultOption={`Use my default (${currencyLabel(props.defaultCurrency)})`}
            onChange={(currency) => {
              setValues((v) => ({ ...v, currency }));
              form.edited("currency");
            }}
            onBlur={() => form.touch("currency")}
          />
          <FieldDescription>
            New projects for this client start in this currency.
          </FieldDescription>
          {form.errorFor("currency") && (
            <FieldError>{form.errorFor("currency")}</FieldError>
          )}
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || !canSave}>
            {props.mode === "create"
              ? pending
                ? "Adding client…"
                : "Add client"
              : pending
                ? "Saving…"
                : "Save changes"}
          </Button>
          {props.mode === "create" && (
            <Button asChild variant="ghost">
              <Link href={props.cancelHref}>Cancel</Link>
            </Button>
          )}
          {state.status === "success" && !pending && !form.isDirty ? (
            <p role="status" className="text-sm text-muted-foreground">
              {state.message}
            </p>
          ) : (
            props.mode === "edit" &&
            !form.isDirty && (
              <p className="text-sm text-muted-foreground">No changes yet</p>
            )
          )}
        </div>
      </FieldGroup>
    </form>
  );
}
