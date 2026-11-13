"use client";

import { Switch } from "@/shared/ui/switch";
import { cn } from "@/shared/lib/utils";
import type { DocumentImages } from "../domain/images";
import {
  COVER_STYLE_LABELS,
  COVER_STYLES,
  type DocumentStyleField,
} from "../domain/style";

/** Cover style and the decorative rings; the photo upload goes under it. */
export function CoverPicker({
  values,
  accent,
  images,
  set,
  photoAvailable,
  children,
}: {
  values: Record<DocumentStyleField, string>;
  accent: string;
  images: DocumentImages;
  set: (field: DocumentStyleField, value: string) => void;
  /** A photo can be used (one is uploaded, or uploads work here). */
  photoAvailable: boolean;
  /** The cover photo upload, right under the cover choices. */
  children?: React.ReactNode;
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
          const unavailable = cover === "image" && !photoAvailable;
          return (
            <button
              key={cover}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={unavailable}
              onClick={() => set("cover", cover)}
              className={cn(
                "grid gap-1.5 rounded-lg border p-2 text-left text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                selected
                  ? "border-primary ring-1 ring-primary"
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
                    : cover === "image"
                      ? {
                          // No photo yet: a hatched placeholder, not "Dark".
                          background:
                            "repeating-linear-gradient(135deg, #e7e9ee 0 6px, #f4f5f7 6px 12px)",
                        }
                      : {
                          background:
                            cover === "dark"
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
          Upload a cover photo below. Until then, the dark cover is used.
        </p>
      )}
      {children}
      <label className="mt-2 flex items-center justify-between gap-3 text-sm max-sm:min-h-11">
        Decorative rings on the cover
        <Switch
          checked={values.coverPattern === "true"}
          onCheckedChange={(on) => set("coverPattern", String(on))}
        />
      </label>
    </fieldset>
  );
}
