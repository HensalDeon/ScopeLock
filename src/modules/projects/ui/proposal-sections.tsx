"use client";

import { Plus, X } from "lucide-react";
import { useId } from "react";
import { CURRENCY_INFO, type CurrencyCode } from "@/shared/lib/currency";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { FieldDescription, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import { PROPOSAL_LIMITS as L } from "../domain/proposal";

export const PROPOSAL_SECTIONS = [
  { id: "heading", label: "Title & subtitle" },
  { id: "overview", label: "Overview" },
  { id: "highlights", label: "Highlights" },
  { id: "timeline", label: "Timeline" },
  { id: "addons", label: "Optional add-ons" },
  { id: "clientProvides", label: "What you need" },
  { id: "exclusions", label: "Not included" },
  { id: "terms", label: "Terms" },
  { id: "validUntil", label: "Valid until" },
] as const;
export type ProposalSectionId = (typeof PROPOSAL_SECTIONS)[number]["id"];

type Row<T> = T & { key: string };
export type ProposalFormValue = {
  active: ProposalSectionId[];
  title: string;
  subtitle: string;
  overview: string;
  callout: string;
  highlights: Row<{ value: string; label: string }>[];
  timeline: Row<{
    id?: string;
    phase: string;
    duration: string;
    description: string;
    isMilestone: boolean;
  }>[];
  addons: Row<{
    id?: string;
    title: string;
    description: string;
    amount: string;
    unit: string;
  }>[];
  clientProvides: string;
  exclusions: string;
  terms: string;
  validUntil: string;
};

let counter = 0;
export const proposalRowKey = () => `p-${++counter}`;

/** What the server receives: only the sections that are switched on. */
export function proposalToJson(v: ProposalFormValue): string {
  const on = (id: ProposalSectionId) => v.active.includes(id);
  const strip = <T extends { key: string }>(row: T): Omit<T, "key"> => {
    const { key, ...rest } = row;
    void key;
    return rest;
  };
  return JSON.stringify({
    title: on("heading") ? v.title : "",
    subtitle: on("heading") ? v.subtitle : "",
    overview: on("overview") ? v.overview : "",
    callout: on("overview") ? v.callout : "",
    highlights: on("highlights") ? v.highlights.map(strip) : [],
    timeline: on("timeline") ? v.timeline.map(strip) : [],
    addons: on("addons") ? v.addons.map(strip) : [],
    clientProvides: on("clientProvides") ? v.clientProvides : "",
    exclusions: on("exclusions") ? v.exclusions : "",
    terms: on("terms") ? v.terms : "",
    validUntil: on("validUntil") ? v.validUntil : "",
  });
}

type Props = {
  value: ProposalFormValue;
  /** The project's currency, for add-on prices. */
  currency: CurrencyCode;
  onChange: (update: (v: ProposalFormValue) => ProposalFormValue) => void;
  /** Error to show for a path under "proposal." (e.g. "highlights.0.value"). */
  errorFor: (path: string, touchKey?: string) => string | undefined;
  touch: (key: string) => void;
  edited: (path: string) => void;
};

/**
 * Optional proposal sections around the priced scope. Each one is added with
 * a click and can be removed again; nothing is required.
 */
export function ProposalSections({
  value,
  onChange,
  errorFor,
  touch,
  edited,
  currency,
}: Props) {
  const uid = useId();
  const inactive = PROPOSAL_SECTIONS.filter(
    (s) => !value.active.includes(s.id),
  );
  const set = <K extends keyof ProposalFormValue>(
    key: K,
    next: ProposalFormValue[K],
  ) => {
    onChange((v) => ({ ...v, [key]: next }));
    edited(String(key));
  };
  const field = (path: string, touchKey = path) => ({
    onBlur: () => touch(`proposal.${touchKey}`),
    "aria-invalid": Boolean(errorFor(path, touchKey)) || undefined,
  });
  const err = (path: string, touchKey?: string) => {
    const message = errorFor(path, touchKey);
    return message ? (
      <p role="alert" className="text-sm text-destructive">
        {message}
      </p>
    ) : null;
  };

  const sectionCard = (id: ProposalSectionId, children: React.ReactNode) => {
    if (!value.active.includes(id)) return null;
    const label = PROPOSAL_SECTIONS.find((s) => s.id === id)?.label;
    return (
      <div
        key={id}
        id={`${uid}-section-${id}`}
        className="grid scroll-mt-24 gap-3 rounded-lg border bg-background p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">{label}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() =>
              onChange((v) => ({
                ...v,
                active: v.active.filter((a) => a !== id),
              }))
            }
          >
            Remove
          </Button>
        </div>
        {children}
      </div>
    );
  };

  const lines = (id: "clientProvides" | "exclusions" | "terms", hint: string) =>
    sectionCard(
      id,
      <>
        <Textarea
          aria-label={PROPOSAL_SECTIONS.find((s) => s.id === id)?.label}
          rows={4}
          value={value[id]}
          onChange={(e) => set(id, e.target.value)}
          {...field(id)}
        />
        <FieldDescription>One per line. {hint}</FieldDescription>
        {err(id)}
      </>,
    );

  // Each section by id; rendered below in the order they were added.
  const cards: Record<ProposalSectionId, React.ReactNode> = {
    heading: sectionCard(
      "heading",
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <FieldLabel htmlFor={`${uid}-title`}>Title on the cover</FieldLabel>
          <Input
            id={`${uid}-title`}
            placeholder="Website design & development proposal"
            value={value.title}
            maxLength={L.title}
            onChange={(e) => set("title", e.target.value)}
            {...field("title")}
          />
          {err("title")}
        </div>
        <div className="grid gap-1.5">
          <FieldLabel htmlFor={`${uid}-subtitle`}>Subtitle</FieldLabel>
          <Input
            id={`${uid}-subtitle`}
            placeholder="A custom 5-page website: design, build and launch"
            value={value.subtitle}
            maxLength={L.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            {...field("subtitle")}
          />
          {err("subtitle")}
        </div>
        <FieldDescription>
          Without these, the cover uses the project name and description.
        </FieldDescription>
      </div>,
    ),
    overview: sectionCard(
      "overview",
      <div className="grid gap-3">
        <Textarea
          aria-label="Overview"
          rows={5}
          placeholder="Thank you for the opportunity… Here's what I'll build and how we'll work."
          value={value.overview}
          maxLength={L.overview}
          onChange={(e) => set("overview", e.target.value)}
          {...field("overview")}
        />
        {err("overview")}
        <div className="grid gap-1.5">
          <FieldLabel htmlFor={`${uid}-callout`}>
            Highlighted note{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </FieldLabel>
          <Input
            id={`${uid}-callout`}
            placeholder="Designed from scratch, inspired by your reference site."
            value={value.callout}
            maxLength={L.callout}
            onChange={(e) => set("callout", e.target.value)}
            {...field("callout")}
          />
          {err("callout")}
        </div>
      </div>,
    ),
    highlights: sectionCard(
      "highlights",
      <div className="grid gap-2">
        {value.highlights.map((h, i) => (
          <div key={h.key} className="grid gap-1">
            <div className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.25rem] gap-2">
              <Input
                aria-label={`Highlight ${i + 1} number`}
                placeholder="5"
                value={h.value}
                maxLength={L.highlightValue}
                onChange={(e) =>
                  set(
                    "highlights",
                    value.highlights.map((x) =>
                      x.key === h.key ? { ...x, value: e.target.value } : x,
                    ),
                  )
                }
                {...field(`highlights.${i}.value`, `${h.key}.value`)}
                className="h-9"
              />
              <Input
                aria-label={`Highlight ${i + 1} label`}
                placeholder="Custom pages"
                value={h.label}
                maxLength={L.highlightLabel}
                onChange={(e) =>
                  set(
                    "highlights",
                    value.highlights.map((x) =>
                      x.key === h.key ? { ...x, label: e.target.value } : x,
                    ),
                  )
                }
                {...field(`highlights.${i}.label`, `${h.key}.label`)}
                className="h-9"
              />
              <RemoveButton
                label={`Remove highlight ${i + 1}`}
                onClick={() =>
                  set(
                    "highlights",
                    value.highlights.filter((x) => x.key !== h.key),
                  )
                }
              />
            </div>
            {err(`highlights.${i}.value`, `${h.key}.value`) ??
              err(`highlights.${i}.label`, `${h.key}.label`)}
          </div>
        ))}
        <AddButton
          disabled={value.highlights.length >= L.highlights}
          onClick={() =>
            set("highlights", [
              ...value.highlights,
              { key: proposalRowKey(), value: "", label: "" },
            ])
          }
        >
          Add a highlight
        </AddButton>
      </div>,
    ),
    timeline: sectionCard(
      "timeline",
      <div className="grid gap-3">
        {value.timeline.map((step, i) => (
          <div
            key={step.key}
            className="grid gap-2 rounded-md border bg-canvas p-3"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_2.25rem] gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_2.25rem]">
              <Input
                aria-label={`Step ${i + 1} name`}
                placeholder="Design"
                value={step.phase}
                maxLength={L.phase}
                onChange={(e) =>
                  set(
                    "timeline",
                    value.timeline.map((x) =>
                      x.key === step.key ? { ...x, phase: e.target.value } : x,
                    ),
                  )
                }
                {...field(`timeline.${i}.phase`, `${step.key}.phase`)}
                className="h-9 bg-background"
              />
              <Input
                aria-label={`Step ${i + 1} duration`}
                placeholder="Days 1–7"
                value={step.duration}
                maxLength={L.duration}
                onChange={(e) =>
                  set(
                    "timeline",
                    value.timeline.map((x) =>
                      x.key === step.key
                        ? { ...x, duration: e.target.value }
                        : x,
                    ),
                  )
                }
                className="col-start-1 row-start-2 h-9 bg-background sm:col-start-2 sm:row-start-1"
              />
              <RemoveButton
                label={`Remove step ${i + 1}`}
                onClick={() =>
                  set(
                    "timeline",
                    value.timeline.filter((x) => x.key !== step.key),
                  )
                }
                className="col-start-2 row-start-1 sm:col-start-3"
              />
            </div>
            <Input
              aria-label={`Step ${i + 1} description`}
              placeholder="What happens in this step"
              value={step.description}
              maxLength={L.stepDescription}
              onChange={(e) =>
                set(
                  "timeline",
                  value.timeline.map((x) =>
                    x.key === step.key
                      ? { ...x, description: e.target.value }
                      : x,
                  ),
                )
              }
              className="h-9 bg-background"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={step.isMilestone}
                onCheckedChange={(on) =>
                  set(
                    "timeline",
                    value.timeline.map((x) =>
                      x.key === step.key ? { ...x, isMilestone: on } : x,
                    ),
                  )
                }
              />
              Mark as a milestone
            </label>
            {err(`timeline.${i}.phase`, `${step.key}.phase`)}
          </div>
        ))}
        <AddButton
          disabled={value.timeline.length >= L.timeline}
          onClick={() =>
            set("timeline", [
              ...value.timeline,
              {
                key: proposalRowKey(),
                phase: "",
                duration: "",
                description: "",
                isMilestone: false,
              },
            ])
          }
        >
          Add a step
        </AddButton>
      </div>,
    ),
    addons: sectionCard(
      "addons",
      <div className="grid gap-3">
        <FieldDescription>
          Not part of the total. Your client can ask for any of these later as a
          change.
        </FieldDescription>
        {value.addons.map((addon, i) => (
          <div
            key={addon.key}
            className="grid gap-2 rounded-md border bg-canvas p-3"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_2.25rem] gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_6rem_2.25rem]">
              <Input
                aria-label={`Add-on ${i + 1} name`}
                placeholder="Extra page"
                value={addon.title}
                maxLength={L.addonTitle}
                onChange={(e) =>
                  set(
                    "addons",
                    value.addons.map((x) =>
                      x.key === addon.key ? { ...x, title: e.target.value } : x,
                    ),
                  )
                }
                {...field(`addons.${i}.title`, `${addon.key}.title`)}
                className="h-9 bg-background"
              />
              <div className="relative col-start-1 row-start-2 sm:col-start-2 sm:row-start-1">
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground"
                >
                  {CURRENCY_INFO[currency].symbol}
                </span>
                <Input
                  aria-label={`Add-on ${i + 1} price, in ${currency}`}
                  inputMode="decimal"
                  placeholder="0"
                  value={addon.amount}
                  onChange={(e) =>
                    set(
                      "addons",
                      value.addons.map((x) =>
                        x.key === addon.key
                          ? { ...x, amount: e.target.value }
                          : x,
                      ),
                    )
                  }
                  {...field(`addons.${i}.amount`, `${addon.key}.amount`)}
                  className="h-9 bg-background tabular-nums"
                  style={{
                    paddingLeft: `calc(0.9rem + ${CURRENCY_INFO[currency].symbol.length}ch)`,
                  }}
                />
              </div>
              <Input
                aria-label={`Add-on ${i + 1} unit`}
                placeholder="/ page"
                value={addon.unit}
                maxLength={L.unit}
                onChange={(e) =>
                  set(
                    "addons",
                    value.addons.map((x) =>
                      x.key === addon.key ? { ...x, unit: e.target.value } : x,
                    ),
                  )
                }
                className="col-start-1 row-start-3 h-9 bg-background sm:col-start-3 sm:row-start-1"
              />
              <RemoveButton
                label={`Remove add-on ${i + 1}`}
                onClick={() =>
                  set(
                    "addons",
                    value.addons.filter((x) => x.key !== addon.key),
                  )
                }
                className="col-start-2 row-start-1 sm:col-start-4"
              />
            </div>
            <Input
              aria-label={`Add-on ${i + 1} description`}
              placeholder="Short description (optional)"
              value={addon.description}
              maxLength={L.addonDescription}
              onChange={(e) =>
                set(
                  "addons",
                  value.addons.map((x) =>
                    x.key === addon.key
                      ? { ...x, description: e.target.value }
                      : x,
                  ),
                )
              }
              className="h-9 bg-background"
            />
            {err(`addons.${i}.title`, `${addon.key}.title`) ??
              err(`addons.${i}.amount`, `${addon.key}.amount`)}
          </div>
        ))}
        <AddButton
          disabled={value.addons.length >= L.addons}
          onClick={() =>
            set("addons", [
              ...value.addons,
              {
                key: proposalRowKey(),
                title: "",
                description: "",
                amount: "",
                unit: "",
              },
            ])
          }
        >
          Add an add-on
        </AddButton>
      </div>,
    ),
    clientProvides: lines(
      "clientProvides",
      "Logo, content, photos, feedback times.",
    ),
    exclusions: lines(
      "exclusions",
      "Spell out what's out of scope, before anyone asks.",
    ),
    terms: lines("terms", "Validity, revisions, when work starts."),
    validUntil: sectionCard(
      "validUntil",
      <div className="grid gap-1.5">
        <Input
          aria-label="Valid until"
          type="date"
          value={value.validUntil}
          onChange={(e) => set("validUntil", e.target.value)}
          {...field("validUntil")}
          className="w-fit"
        />
        <FieldDescription>The last day your prices hold.</FieldDescription>
        {err("validUntil")}
      </div>,
    ),
  };

  return (
    <div className="grid gap-3">
      {/* In the order added, so a new section appears next to the buttons.
          The client's document keeps its own fixed order. */}
      {value.active.map((id) => cards[id])}
      {inactive.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {inactive.map((section) => (
            <Button
              key={section.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // After React renders the new section, put the cursor in it.
                requestAnimationFrame(() => {
                  const card = document.getElementById(
                    `${uid}-section-${section.id}`,
                  );
                  card
                    ?.querySelector<HTMLElement>("input, textarea")
                    ?.focus({ preventScroll: true });
                  card?.scrollIntoView({
                    block: "nearest",
                    behavior: "smooth",
                  });
                });
                onChange((v) => ({
                  ...v,
                  active: [...v.active, section.id],
                  // Start list sections with one empty row to fill in.
                  highlights:
                    section.id === "highlights" && v.highlights.length === 0
                      ? [{ key: proposalRowKey(), value: "", label: "" }]
                      : v.highlights,
                  timeline:
                    section.id === "timeline" && v.timeline.length === 0
                      ? [
                          {
                            key: proposalRowKey(),
                            phase: "",
                            duration: "",
                            description: "",
                            isMilestone: false,
                          },
                        ]
                      : v.timeline,
                  addons:
                    section.id === "addons" && v.addons.length === 0
                      ? [
                          {
                            key: proposalRowKey(),
                            title: "",
                            description: "",
                            amount: "",
                            unit: "",
                          },
                        ]
                      : v.addons,
                }));
              }}
            >
              <Plus aria-hidden />
              {section.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-fit"
      disabled={disabled}
      onClick={onClick}
    >
      <Plus aria-hidden />
      {children}
    </Button>
  );
}

function RemoveButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className={cn("size-9 text-muted-foreground", className)}
    >
      <X aria-hidden />
    </Button>
  );
}
