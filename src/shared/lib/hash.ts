import { createHash } from "node:crypto";

/**
 * Deterministic JSON: object keys are sorted recursively, so the same data
 * always produces the same string (and therefore the same hash), regardless
 * of key insertion order.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value instanceof Date) return value.toISOString();
  if (value !== null && typeof value === "object") {
    // ObjectId and similar types serialise via toJSON/toString.
    if (typeof (value as { toJSON?: unknown }).toJSON === "function") {
      return sortKeys((value as { toJSON: () => unknown }).toJSON());
    }
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
        .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** SHA-256 of the canonical JSON form — used to fingerprint approval snapshots. */
export function hashSnapshot(value: unknown): string {
  return sha256(canonicalJson(value));
}
