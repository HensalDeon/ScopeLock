"use client";

import type { Route } from "next";
import Link from "next/link";
import { useActionState, useId } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { Button } from "@/shared/ui/button";
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
  type ClientField,
} from "../domain/client";
import {
  createClient,
  updateClient,
  type ClientFormState,
} from "../server/actions";

type Defaults = Partial<Record<ClientField, string>>;

/**
 * Add or edit a client. "Add" redirects on success; "edit" stays and shows
 * a saved message. `next` returns to a flow (e.g. New project) afterwards.
 */
export function ClientForm(
  props:
    | { mode: "create"; next?: string; cancelHref: Route }
    | { mode: "edit"; clientId: string; defaults: Defaults },
) {
  // Unique per instance: visited pages stay mounted, so two copies of
  // this form can be in the document at once (CONVENTIONS §5).
  const uid = useId();
  const [state, action, pending] = useActionState<ClientFormState, FormData>(
    props.mode === "create" ? createClient : updateClient,
    IDLE,
  );
  const errors = (state.status === "error" && state.fieldErrors) || {};
  const typed = state.status === "error" ? state.values : undefined;
  const defaults = props.mode === "edit" ? props.defaults : {};
  const value = (field: ClientField) => typed?.[field] ?? defaults[field] ?? "";

  return (
    <form action={action} noValidate>
      {props.mode === "create" ? (
        <input type="hidden" name="next" value={props.next ?? ""} />
      ) : (
        <input type="hidden" name="id" value={props.clientId} />
      )}
      <FieldGroup className="gap-6">
        {state.status === "error" && state.message && (
          <FormAlert>{state.message}</FormAlert>
        )}

        <Field data-invalid={Boolean(errors.name) || undefined}>
          <FieldLabel htmlFor={`${uid}-name`}>Client name</FieldLabel>
          <Input
            id={`${uid}-name`}
            name="name"
            autoComplete="off"
            defaultValue={value("name")}
            key={`name-${value("name")}`}
            maxLength={CLIENT_NAME_MAX_LENGTH}
            aria-invalid={Boolean(errors.name) || undefined}
            autoFocus={props.mode === "create"}
            required
          />
          <FieldDescription>
            The person who approves the work, e.g. Rahul Mehta.
          </FieldDescription>
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Field>

        <Field data-invalid={Boolean(errors.company) || undefined}>
          <FieldLabel htmlFor={`${uid}-company`}>
            Company{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </FieldLabel>
          <Input
            id={`${uid}-company`}
            name="company"
            autoComplete="off"
            defaultValue={value("company")}
            key={`company-${value("company")}`}
            maxLength={CLIENT_COMPANY_MAX_LENGTH}
            aria-invalid={Boolean(errors.company) || undefined}
          />
          {errors.company && <FieldError>{errors.company}</FieldError>}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.phone) || undefined}>
            <FieldLabel htmlFor={`${uid}-phone`}>
              WhatsApp number{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </FieldLabel>
            <Input
              id={`${uid}-phone`}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="98765 43210"
              defaultValue={value("phone")}
              key={`phone-${value("phone")}`}
              aria-invalid={Boolean(errors.phone) || undefined}
            />
            <FieldDescription>For sending approval links.</FieldDescription>
            {errors.phone && <FieldError>{errors.phone}</FieldError>}
          </Field>

          <Field data-invalid={Boolean(errors.email) || undefined}>
            <FieldLabel htmlFor={`${uid}-email`}>
              Email{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </FieldLabel>
            <Input
              id={`${uid}-email`}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="off"
              defaultValue={value("email")}
              key={`email-${value("email")}`}
              aria-invalid={Boolean(errors.email) || undefined}
            />
            <FieldDescription>For approval receipts.</FieldDescription>
            {errors.email && <FieldError>{errors.email}</FieldError>}
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
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
          {state.status === "success" && !pending && (
            <p role="status" className="text-sm text-muted-foreground">
              {state.message}
            </p>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}
