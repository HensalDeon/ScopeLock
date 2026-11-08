"use client";

import { Switch } from "@/shared/ui/switch";
import { cn } from "@/shared/lib/utils";
import type { DocumentImages } from "../domain/images";
import {
  COVER_STYLE_LABELS,
  COVER_STYLES,
  type DocumentStyleField,
} from "../domain/style";

/** Cover style, the decorative rings and the logo switch. */
export function CoverPicker({
  values,
  accent,
  images,
  set,
}: {
  values: Record<DocumentStyleField, string>;
  accent: string;
  images: DocumentImages;
  set: (field: DocumentStyleField, value: string) => void;
}) {
  return (
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
  );
}
