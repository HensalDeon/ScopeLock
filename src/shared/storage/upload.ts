import "server-only";
import {
  detectImageType,
  type AllowedImageType,
} from "@/shared/lib/image-type";

/** What the server accepts (browsers shrink images before sending). */
export const MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Checks an uploaded image by its actual bytes (PNG, JPEG or WebP), not by
 * the file name or the type the browser claimed, and caps its size.
 */
export async function readImageUpload(
  file: FormDataEntryValue | null,
): Promise<
  | { ok: true; buffer: ArrayBuffer; type: AllowedImageType }
  | { ok: false; message: string }
> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose an image to upload." };
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return {
      ok: false,
      message: "That image is too large. Use one under 4 MB.",
    };
  }
  const buffer = await file.arrayBuffer();
  const type = detectImageType(
    new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength)),
  );
  if (!type) return { ok: false, message: "Use a PNG, JPG or WebP image." };
  return { ok: true, buffer, type };
}
