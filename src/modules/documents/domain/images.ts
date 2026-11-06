/**
 * Upload limits. Browsers shrink images before uploading (covers to 2400px,
 * logos to 800px, WebP), so real uploads are usually well under 1 MB. The
 * server cap stays under Vercel's 4.5 MB request limit.
 */
export const MAX_SOURCE_BYTES = 5 * 1024 * 1024; // what people may pick
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // what the server accepts

export const IMAGE_MAX_DIMENSION = { logo: 800, cover: 2400 } as const;

/** The two images a workspace can upload for its documents. */
export const DOCUMENT_IMAGE_KINDS = ["logo", "cover"] as const;
export type DocumentImageKind = (typeof DOCUMENT_IMAGE_KINDS)[number];

/** Signed URLs for a document's images (null when not set). */
export type DocumentImages = {
  logoUrl: string | null;
  coverUrl: string | null;
};
export const NO_IMAGES: DocumentImages = { logoUrl: null, coverUrl: null };
