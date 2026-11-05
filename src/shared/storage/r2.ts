import "server-only";
import { AwsClient } from "aws4fetch";
import { env, isStorageConfigured } from "@/shared/lib/env";
import { generateToken } from "@/shared/lib/token";

/**
 * Cloudflare R2 through its S3-compatible API, signed with aws4fetch (tiny,
 * no AWS SDK). The bucket is private: files are written by our server and
 * read through short-lived signed URLs, never by public link.
 */

export const STORAGE_KINDS = ["logo", "cover"] as const;
export type StorageKind = (typeof STORAGE_KINDS)[number];

function client() {
  const e = env();
  if (!isStorageConfigured()) {
    throw new Error("R2 storage is not configured");
  }
  return {
    aws: new AwsClient({
      accessKeyId: e.R2_ACCESS_KEY_ID as string,
      secretAccessKey: e.R2_SECRET_ACCESS_KEY as string,
      service: "s3",
      region: "auto",
    }),
    base: `https://${e.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${e.R2_BUCKET}`,
  };
}

function objectUrl(base: string, key: string): string {
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * A fresh, unguessable object key inside the workspace's folder. Never built
 * from the uploaded file's name.
 */
export function newStorageKey(
  workspaceId: string,
  kind: StorageKind,
  extension: string,
): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(workspaceId)) {
    throw new Error("Invalid workspace id for a storage key");
  }
  return `ws/${workspaceId}/${kind}/${generateToken(18)}.${extension}`;
}

/** True if `key` belongs to this workspace (guards against stored-key tampering). */
export function keyBelongsTo(key: string, workspaceId: string): boolean {
  return key.startsWith(`ws/${workspaceId}/`) && !key.includes("..");
}

export async function putObject(
  key: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const { aws, base } = client();
  // Sign, then send the raw bytes ourselves. aws4fetch's own fetch passes the
  // body on as a stream, which goes out without a Content-Length, and R2
  // rejects larger uploads with 411 Length Required.
  const signed = await aws.sign(objectUrl(base, key), {
    method: "PUT",
    body,
    headers: {
      "content-type": contentType,
      // Keys are unique per upload, so the content never changes.
      "cache-control": "private, max-age=31536000, immutable",
    },
  });
  const response = await fetch(signed.url, {
    method: "PUT",
    headers: signed.headers,
    body,
  });
  if (!response.ok) {
    throw new Error(`R2 upload failed: ${response.status}`);
  }
}

export async function deleteObject(key: string): Promise<void> {
  const { aws, base } = client();
  const response = await aws.fetch(objectUrl(base, key), { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error(`R2 delete failed: ${response.status}`);
  }
}

/**
 * A GET URL valid for at least an hour. The signing time is rounded down to
 * the hour, so the URL stays identical within that hour and browsers can
 * cache the image instead of downloading it on every page view.
 */
export async function signedUrl(key: string): Promise<string> {
  const { aws, base } = client();
  const hour = new Date();
  hour.setUTCMinutes(0, 0, 0);
  const datetime = hour.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const url = new URL(objectUrl(base, key));
  url.searchParams.set("X-Amz-Expires", String(2 * 60 * 60));
  const signed = await aws.sign(url.toString(), {
    method: "GET",
    aws: { signQuery: true, datetime },
  });
  return signed.url;
}

/** Signed URLs for the keys that exist, or nulls when storage is off. */
export async function signedUrls<K extends string>(
  keys: Record<K, string | null | undefined>,
): Promise<Record<K, string | null>> {
  const entries = await Promise.all(
    (Object.entries(keys) as [K, string | null | undefined][]).map(
      async ([name, key]) =>
        [
          name,
          key && isStorageConfigured() ? await signedUrl(key) : null,
        ] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<K, string | null>;
}
