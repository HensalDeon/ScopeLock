"use client";

import { ImageUp, Trash2 } from "lucide-react";
import { useId, useRef, useState, useTransition } from "react";
import { ALLOWED_IMAGE_TYPES } from "@/shared/lib/image-type";
import { shrinkImage } from "@/shared/lib/shrink-image";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  IMAGE_MAX_DIMENSION,
  MAX_SOURCE_BYTES,
  MAX_UPLOAD_BYTES,
} from "../domain/images";
import { removeDocumentImage, uploadDocumentImage } from "../server/images";

/**
 * Upload, replace or remove the logo or cover image. The image is resized in
 * the browser first, then checked again on the server.
 */
export function ImageUpload({
  kind,
  label,
  hint,
  url,
  enabled,
  onChange,
}: {
  kind: "logo" | "cover";
  label: string;
  hint: string;
  url: string | null;
  enabled: boolean;
  onChange: (url: string | null) => void;
}) {
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"upload" | "remove" | null>(null);

  async function prepare(file: File): Promise<File | null> {
    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
      )
    ) {
      setError("Use a PNG, JPG or WebP image.");
      return null;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError("That image is over 5 MB. Choose a smaller one.");
      return null;
    }
    try {
      const blob = await shrinkImage(file, {
        maxDimension: IMAGE_MAX_DIMENSION[kind],
        keepAlpha: kind === "logo",
      });
      if (blob.size > MAX_UPLOAD_BYTES) {
        setError("That image is still too large after resizing. Try another.");
        return null;
      }
      const extension = blob.type.split("/")[1] ?? "webp";
      return new File([blob], `${kind}.${extension}`, { type: blob.type });
    } catch {
      setError("That file couldn't be read as an image. Try another.");
      return null;
    }
  }

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (!file) return;
    setError(null);
    setAction("upload");
    startTransition(async () => {
      const prepared = await prepare(file);
      if (!prepared) return;
      const data = new FormData();
      data.set("kind", kind);
      data.set("file", prepared);
      const result = await uploadDocumentImage(data);
      if (result.status === "error") setError(result.message);
      else onChange(result.url);
    });
  }

  function onRemove() {
    setError(null);
    setAction("remove");
    startTransition(async () => {
      const data = new FormData();
      data.set("kind", kind);
      const result = await removeDocumentImage(data);
      if (result.status === "error") setError(result.message);
      else onChange(null);
    });
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium" id={`${uid}-label`}>
        {label}
      </p>
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-lg border bg-canvas",
          kind === "logo" ? "h-20" : "aspect-[3/1]",
          // Checkerboard so transparent logos are visible.
          kind === "logo" &&
            url &&
            "bg-[conic-gradient(#eef0f4_90deg,#fff_90deg_180deg,#eef0f4_180deg_270deg,#fff_270deg)] bg-[length:16px_16px]",
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed R2 URL
          <img
            src={url}
            alt={kind === "logo" ? "Your logo" : "Your cover image"}
            className={cn(
              kind === "logo"
                ? "max-h-14 max-w-[70%] object-contain"
                : "size-full object-cover",
            )}
          />
        ) : (
          <p className="px-4 text-center text-sm text-muted-foreground">
            {kind === "logo"
              ? "No logo yet. Your initials are used."
              : "No cover image yet"}
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-labelledby={`${uid}-label`}
        onChange={onPick}
        disabled={!enabled || pending}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!enabled || pending}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUp aria-hidden />
          {pending && action === "upload"
            ? "Uploading…"
            : url
              ? "Replace"
              : "Upload"}
        </Button>
        {url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            disabled={pending}
            onClick={onRemove}
          >
            <Trash2 aria-hidden />
            {pending && action === "remove" ? "Removing…" : "Remove"}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {enabled ? hint : "Image uploads aren't set up on this server yet."}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
