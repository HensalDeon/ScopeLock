/**
 * Browser-side image preparation before upload: corrects phone-camera
 * rotation, scales down to `maxDimension`, and re-encodes. Re-encoding also
 * strips EXIF metadata (camera, GPS location) from the uploaded file.
 *
 * WebP where the browser can encode it; otherwise PNG when transparency
 * matters (logos) or JPEG (photos).
 */
export async function shrinkImage(
  file: Blob,
  { maxDimension, keepAlpha }: { maxDimension: number; keepAlpha: boolean },
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");
  if (!keepAlpha) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86));
  const webp = await encode("image/webp");
  // Some browsers (older Safari) silently return PNG for unsupported types.
  if (webp?.type === "image/webp") return webp;
  const fallback = await encode(keepAlpha ? "image/png" : "image/jpeg");
  if (!fallback) throw new Error("Could not encode the image");
  return fallback;
}
