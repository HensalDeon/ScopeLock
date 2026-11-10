"use client";

import { useId, useState } from "react";
import type { CurrencyCode } from "@/shared/lib/currency";
import type { FormValidation } from "@/shared/lib/use-form-validation";
import { CurrencySelect } from "@/shared/ui/currency-select";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { FormSection } from "@/shared/ui/page";
import { Textarea } from "@/shared/ui/textarea";
import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
} from "../domain/project-input";
import type { ClientOption } from "./project-form";
import { QuickAddClient } from "./quick-add-client";

/**
 * Who the project is for (pick a client or add one inline), its currency,
 * name and short description.
 */
export function ClientProjectFields({
  clients,
  setClients,
  newClientGst,
  clientId,
  setClientId,
  followClient,
  currency,
  setCurrency,
  setCurrencyChosen,
  name,
  setName,
  description,
  setDescription,
  form,
}: {
  clients: ClientOption[];
  setClients: (clients: ClientOption[]) => void;
  newClientGst: number | null;
  clientId: string;
  setClientId: (id: string) => void;
  /** Moves the currency to the client's own, until one is chosen by hand. */
  followClient: (id: string, list?: ClientOption[]) => void;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  setCurrencyChosen: (chosen: boolean) => void;
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  form: FormValidation;
}) {
  const uid = useId();
  const err = (path: string, touchKey?: string) =>
    form.errorFor(path, touchKey);
  const [addingClient, setAddingClient] = useState(clients.length === 0);

  return (
    <FormSection
      title="Client and project"
      description="Who approves the work, and what you're calling it."
    >
      <FieldGroup className="gap-6">
        <Field data-invalid={Boolean(err("clientId")) || undefined}>
          <FieldLabel htmlFor={`${uid}-clientId`}>Client</FieldLabel>
          {clients.length > 0 && (
            <NativeSelect
              id={`${uid}-clientId`}
              name="clientId"
              className="w-full"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                followClient(e.target.value);
                form.edited("clientId");
              }}
              onBlur={() => form.touch("clientId")}
              aria-invalid={Boolean(err("clientId")) || undefined}
            >
              <NativeSelectOption value="">Choose a client</NativeSelectOption>
              {clients.map((client) => (
                <NativeSelectOption key={client.id} value={client.id}>
                  {client.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
          {clients.length === 0 && (
            <input type="hidden" name="clientId" value={clientId} />
          )}
          {err("clientId") && <FieldError>{err("clientId")}</FieldError>}
          {addingClient ? (
            <QuickAddClient
              onAdded={(added) => {
                const client = { ...added, gstPercent: newClientGst };
                const next = [...clients, client].sort((a, b) =>
                  a.label.localeCompare(b.label),
                );
                setClients(next);
                setClientId(client.id);
                followClient(client.id, next);
                setAddingClient(false);
              }}
              onCancel={
                clients.length > 0 ? () => setAddingClient(false) : undefined
              }
            />
          ) : (
            // Wrapped: Field stretches its direct children to full width,
            // which centred the button's text.
            <div>
              <button
                type="button"
                onClick={() => setAddingClient(true)}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
              >
                Client not listed? Add them here
              </button>
            </div>
          )}
        </Field>

        <Field data-invalid={Boolean(err("currency")) || undefined}>
          <FieldLabel htmlFor={`${uid}-currency`}>Currency</FieldLabel>
          <CurrencySelect
            id={`${uid}-currency`}
            name="currency"
            className="w-full sm:w-72"
            value={currency}
            onChange={(value) => {
              if (!value) return;
              setCurrency(value);
              setCurrencyChosen(true);
              form.edited("currency");
            }}
            onBlur={() => form.touch("currency")}
          />
          <FieldDescription>
            Your client sees and pays every amount in this currency. It
            can&apos;t change once the proposal is sent.
          </FieldDescription>
          {err("currency") && <FieldError>{err("currency")}</FieldError>}
        </Field>

        <Field data-invalid={Boolean(err("name")) || undefined}>
          <FieldLabel htmlFor={`${uid}-name`}>Project name</FieldLabel>
          <Input
            id={`${uid}-name`}
            name="name"
            autoComplete="off"
            placeholder="Website redesign"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              form.edited("name");
            }}
            onBlur={() => form.touch("name")}
            maxLength={PROJECT_NAME_MAX_LENGTH}
            aria-invalid={Boolean(err("name")) || undefined}
          />
          {err("name") && <FieldError>{err("name")}</FieldError>}
        </Field>

        <Field data-invalid={Boolean(err("description")) || undefined}>
          <FieldLabel htmlFor={`${uid}-description`}>
            Short description{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </FieldLabel>
          <Textarea
            id={`${uid}-description`}
            name="description"
            rows={2}
            placeholder="5-page website for Mehta Interiors, with a contact form."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              form.edited("description");
            }}
            onBlur={() => form.touch("description")}
            maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
            aria-invalid={Boolean(err("description")) || undefined}
          />
          <FieldDescription>
            Your client sees this above the scope.
          </FieldDescription>
          {err("description") && <FieldError>{err("description")}</FieldError>}
        </Field>
      </FieldGroup>
    </FormSection>
  );
}
