"use client";

import { useActionState, useId, useRef, useState, useTransition } from "react";
import { IDLE } from "@/shared/lib/form-state";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { MoneyInput } from "@/shared/ui/money-input";
import { Section } from "@/shared/ui/page";
import { Textarea } from "@/shared/ui/textarea";
import { useUnsavedGuard } from "@/shared/ui/use-unsaved-guard";
import { lineIssue } from "../domain/plan-lines";
import {
  PLAN_FEATURES,
  planChanges,
  planFromInput,
  planInputSchema,
  type Plan,
  type PlanFeature,
  type PlanFormValues,
} from "../domain/plans";
import { savePlan } from "../server/admin-actions";
import { PlanFeatures } from "./plan-features";
import { PlanHighlights, type HighlightRow } from "./plan-highlights";
import { PlanSaveRow } from "./plan-save-row";

type Text =
  "name" | "summary" | "monthlyRupees" | "activeProjects" | "teamMembers";

/** Errors without the ones `drop` matches (the fields just edited). */
const dropErrors = (
  errors: Record<string, string>,
  drop: (key: string) => boolean,
) => Object.fromEntries(Object.entries(errors).filter(([k]) => !drop(k)));

/** The plan the form's values make, or null while a field can't be read. */
function planOf(values: PlanFormValues): Plan | null {
  const parsed = planInputSchema.safeParse(values);
  return parsed.success ? planFromInput(parsed.data) : null;
}

const rowsOf = (defaults: PlanFormValues): HighlightRow[] =>
  defaults.highlights.map((h, key) => ({ ...h, key }));

/** The form's values without the list keys, as they're sent and compared. */
function payloadOf(
  values: Omit<PlanFormValues, "highlights">,
  rows: HighlightRow[],
): PlanFormValues {
  return {
    ...values,
    highlights: rows.map(({ label, soon }) => ({ label, soon })),
  };
}

/**
 * Admin: edit one plan (name, price, limits, what it unlocks, and the lines
 * the pricing page lists). Saved as one JSON field; the same schema checks
 * it here and on the server.
 */
export function PlanForm({ defaults }: { defaults: PlanFormValues }) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(savePlan, IDLE);
  const [, startTransition] = useTransition();
  const { highlights: initialRows, ...initial } = defaults;
  const [values, setValues] = useState(initial);
  const keyRef = useRef(initialRows.length);
  const [rows, setRows] = useState<HighlightRow[]>(() => rowsOf(defaults));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const payload = payloadOf(values, rows);
  // After a save the page re-renders with the saved plan as `defaults`.
  const dirty = JSON.stringify(payload) !== JSON.stringify(defaults);
  useUnsavedGuard(dirty && !pending);
  const free = values.id === "free";
  const before = planOf(defaults);
  const after = planOf(payload);
  const changes = before && after ? planChanges(before, after) : null;
  // Lines that no longer match the plan (limits, switches, "soon").
  const current = {
    activeProjects: Number(values.activeProjects) || 0,
    teamMembers: Number(values.teamMembers) || 0,
    features: Object.fromEntries(
      PLAN_FEATURES.map((f) => [f, values.features.includes(f)]),
    ) as Record<PlanFeature, boolean>,
  };

  const set = (name: Text, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => dropErrors(e, (k) => k === name));
  };
  const toggle = (feature: PlanFeature, on: boolean) =>
    setValues((v) => ({
      ...v,
      features: PLAN_FEATURES.filter((f) =>
        f === feature ? on : v.features.includes(f),
      ),
    }));

  const text = (
    name: Text,
    label: string,
    hint?: string,
    extra: React.ComponentProps<typeof Input> = {},
  ) => (
    <Field data-invalid={Boolean(errors[name]) || undefined}>
      <FieldLabel htmlFor={`${uid}-${name}`}>{label}</FieldLabel>
      <Input
        id={`${uid}-${name}`}
        value={values[name]}
        onChange={(e) => set(name, e.target.value)}
        aria-invalid={Boolean(errors[name]) || undefined}
        autoComplete="off"
        {...extra}
      />
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError>{errors[name]}</FieldError>
    </Field>
  );

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = planInputSchema.safeParse(payload);
        if (!parsed.success) {
          const next: Record<string, string> = {};
          for (const issue of parsed.error.issues) {
            const key = issue.path.join(".");
            next[key] ??= issue.message;
          }
          setErrors(next);
          // Focus the first field that needs fixing.
          requestAnimationFrame(() =>
            formRef.current
              ?.querySelector<HTMLElement>("[aria-invalid=true]")
              ?.focus(),
          );
          return;
        }
        setErrors({});
        const data = new FormData();
        data.set("payload", JSON.stringify(payload));
        startTransition(() => action(data));
      }}
    >
      <Section
        title="Name and price"
        description="What the pricing page and the plan picker show."
      >
        <div className="grid gap-5">
          {text("name", "Plan name", undefined, { maxLength: 40 })}
          <Field data-invalid={Boolean(errors.summary) || undefined}>
            <FieldLabel htmlFor={`${uid}-summary`}>
              Who it&apos;s for
            </FieldLabel>
            <Textarea
              id={`${uid}-summary`}
              rows={2}
              maxLength={140}
              value={values.summary}
              onChange={(e) => set("summary", e.target.value)}
              aria-invalid={Boolean(errors.summary) || undefined}
            />
            <FieldDescription>
              One line, like “For freelancers and small studios with a full
              client list.”
            </FieldDescription>
            <FieldError>{errors.summary}</FieldError>
          </Field>
          <Field data-invalid={Boolean(errors.monthlyRupees) || undefined}>
            {free ? (
              <span className="text-sm leading-snug font-medium">
                Price a month
              </span>
            ) : (
              <FieldLabel htmlFor={`${uid}-monthlyRupees`}>
                Price a month
              </FieldLabel>
            )}
            {free ? (
              // Free is always ₹0: shown as a fact, not a field.
              <p
                id={`${uid}-monthlyRupees`}
                className="text-[15px] font-semibold tabular-nums"
              >
                ₹0
              </p>
            ) : (
              <MoneyInput
                id={`${uid}-monthlyRupees`}
                currency="INR"
                wrapperClassName="max-w-48"
                value={values.monthlyRupees}
                onChange={(e) => set("monthlyRupees", e.target.value)}
                aria-invalid={Boolean(errors.monthlyRupees) || undefined}
              />
            )}
            <FieldDescription>
              {free
                ? "The Free plan is always free."
                : "Whole rupees, before GST. Every new price is kept in the price history."}
            </FieldDescription>
            <FieldError>{errors.monthlyRupees}</FieldError>
          </Field>
        </div>
      </Section>

      <Section
        title="Limits"
        description="Applied in every workspace on this plan: a new project can't be started past the limit. Archived projects don't count."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {text("activeProjects", "Active projects", undefined, {
            inputMode: "numeric",
            className: "max-w-32 tabular-nums",
          })}
          {text(
            "teamMembers",
            "Team members",
            "Including the owner. Over this, the people who joined last lose access until it fits.",
            { inputMode: "numeric", className: "max-w-32 tabular-nums" },
          )}
        </div>
      </Section>

      <Section
        title="What it unlocks"
        description="Built features apply at once to every workspace on this plan. Ones not built yet only show on the pricing page."
      >
        <PlanFeatures on={values.features} onToggle={toggle} />
      </Section>

      <Section
        title="Pricing page list"
        description="The lines under the plan on the landing and pricing pages, in this order."
      >
        <PlanHighlights
          rows={rows}
          onChange={(next) => {
            setRows(next);
            setErrors((e) => dropErrors(e, (k) => k.startsWith("highlights")));
          }}
          errorFor={(i) =>
            errors[`highlights.${i}.label`]
              ? "Write the line, or remove it."
              : undefined
          }
          issueFor={(row) => lineIssue(row, current)}
          nextKey={() => ++keyRef.current}
        />
        {errors.highlights && (
          <p className="mt-2 text-sm text-destructive">{errors.highlights}</p>
        )}
      </Section>

      <PlanSaveRow
        name={values.name}
        dirty={dirty}
        pending={pending}
        changes={changes}
        invalid={Object.keys(errors).length > 0}
        error={state.status === "error" ? (state.message ?? null) : null}
        saved={state.status === "success" ? (state.message ?? null) : null}
        onDiscard={() => {
          setValues(initial);
          setRows(rowsOf(defaults));
          setErrors({});
        }}
      />
    </form>
  );
}
