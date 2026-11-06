"use client";

import { Check } from "lucide-react";
import { useActionState, useId, useRef, useState, useTransition } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { cn } from "@/shared/lib/utils";
import {
  focusFirstInvalid,
  useFormValidation,
} from "@/shared/lib/use-form-validation";
import { Button } from "@/shared/ui/button";
import { FieldError, FieldLabel } from "@/shared/ui/field";
import { FormAlert } from "@/shared/ui/form-alert";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import type { ProposalDocumentData } from "../domain/document-data";
import type { DocumentImages } from "../domain/images";
import {
  ACCENT_PRESETS,
  accentNeedsDarkening,
  COVER_STYLE_LABELS,
  COVER_STYLES,
  documentStyleSchema,
  styleToFormValues,
  type DocumentStyle,
  type DocumentStyleField,
} from "../domain/style";
import { isHex } from "../domain/color";
import {
  updateDocumentStyle,
  type DocumentStyleFormState,
} from "../server/actions";
import { ClassicDocument } from "./classic-document";
import { ImageUpload } from "./image-upload";

type Values = Record<DocumentStyleField, string>;

/**
 * Settings → Documents: pick the look of every client-facing document, with
 * the real template updating live beside the controls.
 */
export function DocumentStyleEditor({
  initial,
  preview,
  images: initialImages,
  uploadsEnabled,
}: {
  initial: DocumentStyle;
  preview: ProposalDocumentData;
  images: DocumentImages;
  uploadsEnabled: boolean;
}) {
  // Kept locally so the preview shows a new image the moment it's uploaded.
  const [images, setImages] = useState(initialImages);
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<
    DocumentStyleFormState,
    FormData
  >(updateDocumentStyle, IDLE);
  const [, startTransition] = useTransition();
  const saved = styleToFormValues(initial);
  const [values, setValues] = useState<Values>(saved);
  const form = useFormValidation(documentStyleSchema, values, {
    initial: saved,
    serverState: state,
  });

  const set = (field: DocumentStyleField, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    form.edited(field);
  };
  // The preview never breaks: a half-typed hex keeps the last valid colour.
  const [lastValidAccent, setLastValidAccent] = useState(initial.accent);
  const accent = isHex(values.accent) ? values.accent : lastValidAccent;
  const style: DocumentStyle = {
    template: "classic",
    accent,
    cover: values.cover as DocumentStyle["cover"],
    coverPattern: values.coverPattern === "true",
    headingFont: values.headingFont as DocumentStyle["headingFont"],
    showLogo: values.showLogo === "true",
  };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
      <form
        ref={formRef}
        noValidate
        className="grid gap-7"
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
        {Object.entries(values).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        {state.status === "error" && state.message && (
          <FormAlert>{state.message}</FormAlert>
        )}

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Template</legend>
          <div className="flex items-start gap-3 rounded-lg border border-brand/45 bg-success-soft/70 p-3">
            <div
              aria-hidden
              className="h-12 w-9 shrink-0 overflow-hidden rounded-sm border bg-white"
            >
              <div className="h-4" style={{ background: "#15161a" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Classic</p>
              <p className="text-sm text-muted-foreground">
                Cover page, highlights and numbered sections.
              </p>
            </div>
          </div>
        </fieldset>

        <fieldset className="grid gap-3">
          <legend className="mb-2 text-sm font-medium">Accent colour</legend>
          <div
            role="radiogroup"
            aria-label="Accent colour"
            className="flex flex-wrap gap-2"
          >
            {ACCENT_PRESETS.map((preset) => {
              const selected = values.accent === preset.hex;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={preset.label}
                  title={preset.label}
                  onClick={() => {
                    set("accent", preset.hex);
                    setLastValidAccent(preset.hex);
                  }}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full ring-offset-2 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected && "ring-2 ring-foreground",
                  )}
                  style={{ background: preset.hex }}
                >
                  {selected && (
                    <Check
                      aria-hidden
                      className="size-4 text-white drop-shadow"
                    />
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
              value={accent}
              onChange={(e) => {
                set("accent", e.target.value);
                setLastValidAccent(e.target.value as DocumentStyle["accent"]);
              }}
              className="h-9 w-11 cursor-pointer rounded-md border bg-background p-1"
            />
            <FieldLabel htmlFor={`${uid}-hex`} className="sr-only">
              Colour code
            </FieldLabel>
            <Input
              id={`${uid}-hex`}
              value={values.accent}
              maxLength={7}
              spellCheck={false}
              onChange={(e) => {
                const next = e.target.value.trim();
                set("accent", next);
                if (isHex(next)) setLastValidAccent(next);
              }}
              onBlur={() => form.touch("accent")}
              aria-invalid={Boolean(form.errorFor("accent")) || undefined}
              className="h-9 w-28 font-mono text-sm uppercase"
            />
          </div>
          {form.errorFor("accent") && (
            <FieldError>{form.errorFor("accent")}</FieldError>
          )}
          {isHex(values.accent) && accentNeedsDarkening(values.accent) && (
            <p className="text-sm text-muted-foreground">
              This colour is light, so a slightly darker shade of it is used for
              text to keep it readable.
            </p>
          )}
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Cover</legend>
          <div
            role="radiogroup"
            aria-label="Cover"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {COVER_STYLES.map((cover) => {
              const selected = values.cover === cover;
              return (
                <button
                  key={cover}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => set("cover", cover)}
                  className={cn(
                    "grid gap-1.5 rounded-lg border p-2 text-left text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-brand/45 bg-success-soft/70"
                      : "hover:bg-canvas",
                  )}
                >
                  <span
                    aria-hidden
                    className="h-7 rounded-sm border"
                    style={
                      cover === "image" && images.coverUrl
                        ? {
                            backgroundImage: `linear-gradient(rgb(15 16 20 / 0.5), rgb(15 16 20 / 0.5)), url(${JSON.stringify(images.coverUrl)})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : {
                            background:
                              cover === "dark" || cover === "image"
                                ? "#15161a"
                                : cover === "accent"
                                  ? accent
                                  : `${accent}24`,
                          }
                    }
                  />
                  <span className="font-medium">
                    {COVER_STYLE_LABELS[cover].title}
                  </span>
                </button>
              );
            })}
          </div>
          {values.cover === "image" && !images.coverUrl && (
            <p className="text-sm text-muted-foreground">
              Upload a cover image below. Until then, the dark cover is used.
            </p>
          )}
          <label className="mt-2 flex items-center justify-between gap-3 text-sm">
            Decorative rings on the cover
            <Switch
              checked={values.coverPattern === "true"}
              onCheckedChange={(on) => set("coverPattern", String(on))}
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            {images.logoUrl
              ? "Show your logo on the cover"
              : "Show your initials on the cover"}
            <Switch
              checked={values.showLogo === "true"}
              onCheckedChange={(on) => set("showLogo", String(on))}
            />
          </label>
        </fieldset>

        <fieldset className="grid gap-5">
          <legend className="mb-2 text-sm font-medium">
            Logo and cover image
          </legend>
          <ImageUpload
            kind="logo"
            label="Logo"
            hint="PNG, JPG or WebP, up to 5 MB. A transparent PNG looks best."
            url={images.logoUrl}
            enabled={uploadsEnabled}
            onChange={(logoUrl) => setImages((i) => ({ ...i, logoUrl }))}
          />
          <ImageUpload
            kind="cover"
            label="Cover image"
            hint="PNG, JPG or WebP, up to 5 MB. A wide photo of your work works well."
            url={images.coverUrl}
            enabled={uploadsEnabled}
            onChange={(coverUrl) => {
              setImages((i) => ({ ...i, coverUrl }));
              // A new photo is meant to be seen: switch the cover to it.
              if (coverUrl) set("cover", "image");
              else if (values.cover === "image") set("cover", "dark");
            }}
          />
        </fieldset>

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
              const selected = values.headingFont === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => set("headingFont", option.value)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-2.5 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-brand/45 bg-success-soft/70"
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

        <div className="flex flex-wrap items-center gap-3 border-t pt-5">
          <Button type="submit" disabled={pending || !form.isDirty}>
            {pending ? "Saving…" : "Save style"}
          </Button>
          {!pending && !form.isDirty && (
            <p role="status" className="text-sm text-muted-foreground">
              {state.status === "success" ? state.message : "No changes yet"}
            </p>
          )}
        </div>
      </form>

      <div className="min-w-0 lg:sticky lg:top-6">
        <p className="mb-2 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Live preview
        </p>
        <div className="max-h-[78vh] overflow-auto rounded-lg border bg-[#ebe8e2] p-3 lg:p-5">
          <ClassicDocument
            data={preview}
            style={style}
            images={images}
            className="mx-auto max-w-[210mm] rounded-sm shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] lg:[zoom:0.72]"
          />
        </div>
      </div>
    </div>
  );
}
