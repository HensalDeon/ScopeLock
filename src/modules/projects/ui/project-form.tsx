"use client";

import { Plus, X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useActionState, useId, useRef, useState, useTransition } from "react";
import { formatINR } from "@/shared/lib/money";
import { IDLE } from "@/shared/lib/form-state";
import {
  focusFirstInvalid,
  useFormValidation,
} from "@/shared/lib/use-form-validation";
import { cn } from "@/shared/lib/utils";
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
import { NativeSelect, NativeSelectOption } from "@/shared/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Textarea } from "@/shared/ui/textarea";
import {
  MILESTONE_LIMITS,
  MILESTONE_PRESETS,
  splitByMilestones,
  type BillingModel,
} from "../domain/billing";
import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  projectInputSchema,
} from "../domain/project";
import { draftTotal, SCOPE_LIMITS } from "../domain/scope";
import {
  createProject,
  updateProject,
  type ProjectFormState,
} from "../server/actions";
import { QuickAddClient } from "./quick-add-client";

type ItemRow = {
  key: string;
  id?: string;
  title: string;
  description: string;
  amount: string;
  showNote: boolean;
};
type MilestoneRow = { key: string; id?: string; name: string; percent: string };

export type ProjectFormDefaults = {
  clientId: string;
  name: string;
  description: string;
  items: { id?: string; title: string; description: string; amount: string }[];
  billingModel: BillingModel;
  milestones: { id?: string; name: string; percent: string }[];
};

export type ClientOption = { id: string; label: string };

let rowCounter = 0;
const rowKey = () => `row-${++rowCounter}`;

const toItemRows = (items: ProjectFormDefaults["items"]): ItemRow[] =>
  (items.length ? items : [{ title: "", description: "", amount: "" }]).map(
    (item) => ({
      ...item,
      key: rowKey(),
      showNote: Boolean(item.description),
    }),
  );

const toMilestoneRows = (
  milestones: { id?: string; name: string; percent: string | number }[],
): MilestoneRow[] =>
  milestones.map((m) => ({
    id: m.id,
    name: m.name,
    percent: String(m.percent),
    key: rowKey(),
  }));

const DEFAULT_PRESET = MILESTONE_PRESETS[0];

/**
 * Create or edit a draft project: who it's for, the agreed scope (lines with
 * amounts and a live total) and how the client pays (upfront or milestones
 * that must add up to 100%). Rows are kept in state and sent as JSON.
 */
export function ProjectForm({
  mode,
  projectId,
  clients: initialClients,
  defaults,
  cancelHref,
}: {
  mode: "create" | "edit";
  projectId?: string;
  clients: ClientOption[];
  defaults: ProjectFormDefaults;
  cancelHref: Route;
}) {
  // Unique per instance: visited pages stay mounted, so two copies of
  // this form can be in the document at once (CONVENTIONS §5).
  const uid = useId();
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(
    mode === "create" ? createProject : updateProject,
    IDLE,
  );
  const [, startTransition] = useTransition();

  const [clients, setClients] = useState(initialClients);
  const [clientId, setClientId] = useState(defaults.clientId);
  // Controlled: React resets uncontrolled inputs after a form action, which
  // would clear them on a validation error.
  const [name, setName] = useState(defaults.name);
  const [description, setDescription] = useState(defaults.description);
  const [addingClient, setAddingClient] = useState(initialClients.length === 0);
  const [items, setItems] = useState(() => toItemRows(defaults.items));
  const [billingModel, setBillingModel] = useState(defaults.billingModel);
  const [milestones, setMilestones] = useState(() =>
    toMilestoneRows(
      defaults.billingModel === "milestones" && defaults.milestones.length
        ? defaults.milestones
        : (DEFAULT_PRESET?.milestones ?? []),
    ),
  );

  // What the server receives, built from state; validated live with the
  // server's own schema (see useFormValidation).
  const itemsJson = JSON.stringify(
    items.map(({ id, title, description, amount }) => ({
      id,
      title,
      description,
      amount,
    })),
  );
  const milestonesJson = JSON.stringify(
    billingModel === "milestones"
      ? milestones.map(({ id, name, percent }) => ({ id, name, percent }))
      : [],
  );
  const values = {
    clientId,
    name,
    description,
    items: itemsJson,
    billingModel,
    milestones: milestonesJson,
  };
  const [savedValues] = useState(values);
  const formRef = useRef<HTMLFormElement>(null);
  const form = useFormValidation(projectInputSchema, values, {
    initial: mode === "edit" ? savedValues : undefined,
    serverState: state,
  });
  const err = (path: string, touchKey?: string) =>
    form.errorFor(path, touchKey);

  const total = draftTotal(items.map((item) => item.amount));
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

  const updateItem = (key: string, patch: Partial<ItemRow>) =>
    setItems((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  const updateMilestone = (key: string, patch: Partial<MilestoneRow>) =>
    setMilestones((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  return (
    <form
      // Submitted by hand instead of <form action>: React resets a form after
      // an action, which clears the controlled client <select> on a
      // validation error. This form needs JavaScript anyway (rows are JSON).
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.markSubmitted()) {
          focusFirstInvalid(formRef.current);
          return;
        }
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      noValidate
      className="grid gap-10"
    >
      {mode === "edit" && projectId && (
        <input type="hidden" name="id" value={projectId} />
      )}
      <input type="hidden" name="items" value={itemsJson} />
      <input type="hidden" name="milestones" value={milestonesJson} />

      {state.status === "error" && state.message && (
        <FormAlert>{state.message}</FormAlert>
      )}

      {/* ── Who it's for ─────────────────────────────────────────────── */}
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
                  form.edited("clientId");
                }}
                onBlur={() => form.touch("clientId")}
                aria-invalid={Boolean(err("clientId")) || undefined}
              >
                <NativeSelectOption value="">
                  Choose a client
                </NativeSelectOption>
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
                onAdded={(client) => {
                  setClients((list) =>
                    [...list, client].sort((a, b) =>
                      a.label.localeCompare(b.label),
                    ),
                  );
                  setClientId(client.id);
                  setAddingClient(false);
                }}
                onCancel={
                  clients.length > 0 ? () => setAddingClient(false) : undefined
                }
              />
            ) : (
              <button
                type="button"
                onClick={() => setAddingClient(true)}
                className="w-fit self-start text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Client not listed? Add them here
              </button>
            )}
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
            {err("description") && (
              <FieldError>{err("description")}</FieldError>
            )}
          </Field>
        </FieldGroup>
      </FormSection>

      {/* ── Scope ────────────────────────────────────────────────────── */}
      <FormSection
        title="What's included"
        description="List every deliverable and its price. Anything not on this list becomes a change request later."
      >
        <div className="grid gap-3">
          <ol className="grid gap-3">
            {items.map((item, index) => {
              const titleError = err(
                `items.${index}.title`,
                `${item.key}.title`,
              );
              const amountError = err(
                `items.${index}.amount`,
                `${item.key}.amount`,
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
                    <div className="relative col-start-1 row-start-2 sm:col-start-2 sm:row-start-1">
                      <span
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground"
                      >
                        ₹
                      </span>
                      <Input
                        aria-label={`Amount for deliverable ${index + 1}, in rupees`}
                        inputMode="decimal"
                        placeholder="0"
                        value={item.amount}
                        onChange={(e) => {
                          updateItem(item.key, { amount: e.target.value });
                          form.edited(`items.${index}.amount`);
                        }}
                        onBlur={() => form.touch(`${item.key}.amount`)}
                        aria-invalid={Boolean(amountError) || undefined}
                        className="h-9 pl-6 tabular-nums"
                      />
                    </div>
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
                  {item.showNote ? (
                    <Textarea
                      aria-label={`Note for deliverable ${index + 1}`}
                      placeholder="What's included, e.g. up to 2 rounds of changes"
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
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateItem(item.key, { showNote: true })}
                      className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Add a note
                    </button>
                  )}
                  {noteError && (
                    <p role="alert" className="mt-1 text-sm text-destructive">
                      {noteError}
                    </p>
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
                    amount: "",
                    showNote: false,
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
                {formatINR(total)}
              </span>
            </p>
          </div>
        </div>
      </FormSection>

      {/* ── Payment terms ────────────────────────────────────────────── */}
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
                {formatINR(total)}
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
                {milestones.map((milestone, index) => {
                  const nameError = err(
                    `milestones.${index}.name`,
                    `${milestone.key}.name`,
                  );
                  const percentError = err(
                    `milestones.${index}.percent`,
                    `${milestone.key}.percent`,
                  );
                  return (
                    <li key={milestone.key}>
                      <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_2.25rem] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_5.5rem_7rem_2.25rem]">
                        <Input
                          aria-label={`Payment ${index + 1} name`}
                          value={milestone.name}
                          maxLength={MILESTONE_LIMITS.nameMax}
                          onChange={(e) => {
                            updateMilestone(milestone.key, {
                              name: e.target.value,
                            });
                            form.edited(`milestones.${index}.name`);
                          }}
                          onBlur={() => form.touch(`${milestone.key}.name`)}
                          aria-invalid={Boolean(nameError) || undefined}
                          className="h-9"
                        />
                        <div className="relative">
                          <Input
                            aria-label={`Payment ${index + 1} percentage`}
                            inputMode="numeric"
                            value={milestone.percent}
                            onChange={(e) => {
                              updateMilestone(milestone.key, {
                                percent: e.target.value
                                  .replace(/[^\d]/g, "")
                                  .slice(0, 3),
                              });
                              form.edited(`milestones.${index}.percent`);
                            }}
                            onBlur={() =>
                              form.touch(`${milestone.key}.percent`)
                            }
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
                          {amounts?.[index] !== undefined
                            ? formatINR(amounts[index])
                            : "–"}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-9 text-muted-foreground"
                          disabled={milestones.length <= MILESTONE_LIMITS.min}
                          onClick={() =>
                            setMilestones((rows) =>
                              rows.filter((row) => row.key !== milestone.key),
                            )
                          }
                          aria-label={`Remove payment ${index + 1}`}
                        >
                          <X aria-hidden />
                        </Button>
                      </div>
                      {amounts?.[index] !== undefined && (
                        <p className="mt-1 text-sm text-muted-foreground tabular-nums sm:hidden">
                          {formatINR(amounts[index])}
                        </p>
                      )}
                      {(nameError || percentError) && (
                        <p
                          role="alert"
                          className="mt-1 text-sm text-destructive"
                        >
                          {nameError ?? percentError}
                        </p>
                      )}
                    </li>
                  );
                })}
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

      <div className="flex flex-wrap items-center gap-3 border-t pt-6">
        <Button
          type="submit"
          size="lg"
          disabled={pending || (mode === "edit" && !form.isDirty)}
        >
          {mode === "create"
            ? pending
              ? "Creating project…"
              : "Create project"
            : pending
              ? "Saving…"
              : "Save changes"}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          It stays a draft until you send it to your client.
        </p>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:gap-10">
      <div className="grid content-start gap-1">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <p className="text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
