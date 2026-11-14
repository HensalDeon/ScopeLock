"use client";

import { useActionState, useId, useRef, useState, useTransition } from "react";
import { IDLE } from "@/shared/lib/form-state";
import {
  focusFirstInvalid,
  useFormValidation,
} from "@/shared/lib/use-form-validation";
import { useUnsavedGuard } from "@/shared/ui/use-unsaved-guard";
import { Button } from "@/shared/ui/button";
import { FormAlert } from "@/shared/ui/form-alert";
import { TOUCH } from "@/shared/ui/touch";
import { cn } from "@/shared/lib/utils";
import type { ProposalDocumentData } from "../domain/document-data";
import type { DocumentImages } from "../domain/images";
import {
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
import { AccentPicker, HeadingPicker } from "./style-pickers";
import { CoverPicker } from "./style-cover-picker";
import { ImageUpload } from "./image-upload";
import { LogoControls } from "./style-logo";

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
  branded,
}: {
  initial: DocumentStyle;
  preview: ProposalDocumentData;
  images: DocumentImages;
  uploadsEnabled: boolean;
  /** The plan shows the logo to clients (Pro, Agency). */
  branded: boolean;
}) {
  // Kept locally so the preview shows a new image the moment it's uploaded.
  const [images, setImages] = useState(initialImages);
  const uid = useId();
  const [fullSample, setFullSample] = useState(false);
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
  useUnsavedGuard(form.isDirty && !pending);

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
        id={`${uid}-form`}
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

        <AccentPicker
          uid={uid}
          value={values.accent}
          shown={accent}
          onChange={(next) => {
            set("accent", next);
            if (isHex(next)) setLastValidAccent(next);
          }}
          onBlur={() => form.touch("accent")}
          error={form.errorFor("accent")}
        />

        <HeadingPicker
          value={values.headingFont}
          onChange={(font) => set("headingFont", font)}
        />

        <CoverPicker
          values={values}
          accent={accent}
          images={images}
          set={set}
          photoAvailable={uploadsEnabled || Boolean(images.coverUrl)}
        >
          {uploadsEnabled && (
            <ImageUpload
              kind="cover"
              label="Cover photo"
              hint="PNG, JPG or WebP, up to 5 MB. A wide photo of your work works well."
              url={images.coverUrl}
              enabled
              onChange={(coverUrl) => {
                setImages((i) => ({ ...i, coverUrl }));
                // A new photo is meant to be seen: choose it (saved with
                // the style, as the message says).
                if (coverUrl) set("cover", "image");
                else if (values.cover === "image") set("cover", "dark");
              }}
              savedText={
                initial.cover === "image"
                  ? "Uploaded. Clients see the new cover photo now."
                  : "Uploaded and chosen as your cover. Save the style to show it to clients."
              }
              removedText={
                initial.cover === "image"
                  ? "Removed. Clients see the dark cover until you choose another."
                  : "Removed."
              }
            />
          )}
        </CoverPicker>

        <LogoControls
          logoUrl={images.logoUrl}
          showLogo={values.showLogo === "true"}
          onShowLogo={(on) => set("showLogo", String(on))}
          uploadsEnabled={uploadsEnabled}
          branded={branded}
          onUploaded={(logoUrl) => setImages((i) => ({ ...i, logoUrl }))}
        />

        {!uploadsEnabled && (
          <p className="text-sm text-pretty text-muted-foreground">
            Logos and cover photos can&apos;t be uploaded here yet, so your
            initials and the cover colours above are used.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t pt-5">
          <Button
            type="submit"
            className={TOUCH}
            variant={form.isDirty ? "default" : "outline"}
            disabled={pending || !form.isDirty}
          >
            {pending ? "Saving…" : "Save style"}
          </Button>
          {!pending && !form.isDirty && (
            <p role="status" className="text-sm text-muted-foreground">
              {state.status === "success"
                ? state.message
                : "Matches what clients see"}
            </p>
          )}
        </div>
      </form>

      <div
        id={`${uid}-preview`}
        className="min-w-0 scroll-mt-20 max-lg:order-first lg:sticky lg:top-6"
      >
        <p className="mb-2 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Live preview
        </p>
        {/* The preview shows edits at once; clients only get them on save. */}
        {form.isDirty && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg bg-warning-soft px-4 py-2.5 text-sm text-warning-ink">
            <p>Not saved yet. Clients still see your saved style.</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={TOUCH}
                onClick={() => {
                  setValues(saved);
                  setLastValidAccent(initial.accent);
                }}
              >
                Discard
              </Button>
              <Button
                type="submit"
                form={`${uid}-form`}
                size="sm"
                variant="outline"
                className={TOUCH}
                disabled={pending}
              >
                {pending ? "Saving…" : "Save style"}
              </Button>
            </div>
          </div>
        )}
        {!branded && images.logoUrl && (
          <p className="text-sm text-pretty text-muted-foreground">
            The preview shows what clients see on Free: your initials, not your
            logo.
          </p>
        )}
        {/* A window onto the full sample (it's ~4,000px on a phone), so the
            default-text form below stays within reach. */}
        {/* Desktop: a scrolling window onto the full sample, beside the
            controls. Phones: above the controls, cut to the cover (what
            the colour and cover choices change), with the rest on request,
            so the page doesn't scroll inside itself. */}
        <div
          tabIndex={0}
          aria-label="Document preview"
          className={cn(
            "relative rounded-lg border bg-[#ebe8e2] p-3 lg:max-h-[78vh] lg:overflow-auto lg:p-5",
            !fullSample && "max-lg:max-h-[26rem] max-lg:overflow-hidden",
          )}
        >
          <ClassicDocument
            titleAs="h2"
            data={preview}
            style={style}
            // What clients see: no logo unless the plan includes branding.
            images={branded ? images : { ...images, logoUrl: null }}
            className="mx-auto max-w-[210mm] rounded-[2px] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] lg:[zoom:0.72]"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            TOUCH,
            "mt-1 px-0 underline underline-offset-4 lg:hidden",
          )}
          aria-expanded={fullSample}
          onClick={() => setFullSample((v) => !v)}
        >
          {fullSample ? "Show just the cover" : "Show the full sample"}
        </Button>
      </div>
    </div>
  );
}
