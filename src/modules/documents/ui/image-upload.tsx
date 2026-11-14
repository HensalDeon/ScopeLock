"use client";

import { ImageUploadField } from "@/shared/ui/image-upload-field";
import { IMAGE_MAX_DIMENSION } from "../domain/images";
import { removeDocumentImage, uploadDocumentImage } from "../server/images";

/** The workspace logo or cover image, through the shared upload field. */
export function ImageUpload({
  kind,
  label,
  hint,
  url,
  enabled,
  onChange,
  savedText,
  removedText,
}: {
  kind: "logo" | "cover";
  label: string;
  hint: string;
  url: string | null;
  enabled: boolean;
  onChange: (url: string | null) => void;
  /** What's true for clients after an upload or removal. */
  savedText: string;
  removedText: string;
}) {
  return (
    <ImageUploadField
      label={label}
      hint={hint}
      url={url}
      enabled={enabled}
      onChange={onChange}
      upload={(data) => {
        data.set("kind", kind);
        return uploadDocumentImage(data);
      }}
      remove={() => {
        const data = new FormData();
        data.set("kind", kind);
        return removeDocumentImage(data);
      }}
      maxDimension={IMAGE_MAX_DIMENSION[kind]}
      shape={kind === "logo" ? "logo" : "wide"}
      emptyText={
        kind === "logo"
          ? "No logo yet. Your initials are used."
          : "No cover image yet"
      }
      alt={kind === "logo" ? "Your logo" : "Your cover image"}
      savedText={savedText}
      removedText={removedText}
    />
  );
}
