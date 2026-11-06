/**
 * Identifies an image by its first bytes ("magic numbers"), not by its file
 * name or the type the browser claims, both of which the uploader controls.
 * Only PNG, JPEG and WebP are accepted: no SVG (can carry scripts), no GIF.
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

const EXTENSIONS: Record<AllowedImageType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function detectImageType(bytes: Uint8Array): AllowedImageType | null {
  const at = (offset: number, ...expected: number[]) =>
    expected.every((value, i) => bytes[offset + i] === value);
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  // "RIFF" .... "WEBP"
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) {
    return "image/webp";
  }
  return null;
}

export function extensionFor(type: AllowedImageType): string {
  return EXTENSIONS[type];
}
