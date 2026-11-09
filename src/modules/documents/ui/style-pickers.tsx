"use client";

import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { accentNeedsDarkening, ACCENT_PRESETS } from "../domain/style";
import { isHex } from "../domain/color";
import type { DocumentStyle } from "../domain/style";

/** Accent colour: presets, a colour picker and a hex field. */
export function AccentPicker({
  uid,
  value,
  shown,
  onChange,
  onBlur,
  error,
}: {
  uid: string;
  /** As typed (may be half a hex code). */
  value: string;
  /** The last valid colour, for the picker. */
  shown: string;
  onChange: (next: string) => void;
  onBlur: () => void;
  error: string | undefined;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-2 text-sm font-medium">Accent colour</legend>
      <div
        role="radiogroup"
        aria-label="Accent colour"
        className="flex flex-wrap gap-2"
      >
        {ACCENT_PRESETS.map((preset) => {
          const selected = value === preset.hex;
          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={preset.label}
              title={preset.label}
              onClick={() => onChange(preset.hex)}
              className={cn(
                "flex size-9 items-center justify-center rounded-full ring-offset-2 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected && "ring-2 ring-foreground",
              )}
              style={{ background: preset.hex }}
            >
              {selected && (
                <Check aria-hidden className="size-4 text-white drop-shadow" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`${uid}-picker`}>
          Pick a custom colour
        </label>
        <input
          id={`${uid}-picker`}
          type="color"
          value={shown}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-11 cursor-pointer rounded-md border bg-background p-1"
        />
        <FieldLabel htmlFor={`${uid}-hex`} className="sr-only">
          Colour code
        </FieldLabel>
        <Input
          id={`${uid}-hex`}
          value={value}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value.trim())}
          onBlur={onBlur}
          aria-invalid={Boolean(error) || undefined}
          className="h-9 w-28 font-mono text-sm uppercase"
        />
      </div>
      {error && <FieldError>{error}</FieldError>}
      {isHex(value) && accentNeedsDarkening(value) && (
        <p className="text-sm text-muted-foreground">
          This colour is light, so a slightly darker shade of it is used for
          text to keep it readable.
        </p>
      )}
    </fieldset>
  );
}

/** Serif or sans headings. */
export function HeadingPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (font: DocumentStyle["headingFont"]) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-medium">Headings</legend>
      <div
        role="radiogroup"
        aria-label="Headings"
        className="grid grid-cols-2 gap-2"
      >
        {(
          [
            {
              value: "serif",
              label: "Serif",
              sample: "Aa",
              className:
                "font-(family-name:--font-doc-serif) text-xl font-semibold",
            },
            {
              value: "sans",
              label: "Sans",
              sample: "Aa",
              className: "text-lg font-semibold",
            },
          ] as const
        ).map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-2.5 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary ring-1 ring-primary"
                  : "hover:bg-canvas",
              )}
            >
              <span aria-hidden className={option.className}>
                {option.sample}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
