import "server-only";
import { createHash } from "node:crypto";

/**
 * Bump when canonicalJson's rules change, and store it next to every hash so
 * old approval records can still be re-verified with the rules they used.
 */
export const SNAPSHOT_HASH_VERSION = 1;

/**
 * Deterministic JSON for evidence snapshots. The same data always produces
 * the same string (and so the same hash):
 * - object keys sorted recursively; `undefined` values dropped
 * - strings Unicode-normalised (NFC), so "é" typed two ways hashes the same
 * - Dates → ISO strings; ObjectIds → hex strings
 * - numbers must be safe integers (money is paise, shares are whole numbers)
 *
 * Anything it can't represent faithfully (Map, Set, class instances, floats,
 * NaN, bigint, functions) throws instead of being silently dropped.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalize(value, "$"));
}

function normalize(value: unknown, path: string): unknown {
  if (value === null) return null;
  switch (typeof value) {
    case "string":
      return value.normalize("NFC");
    case "boolean":
      return value;
    case "number":
      if (!Number.isSafeInteger(value)) {
        throw new TypeError(`${path}: snapshot numbers must be safe integers`);
      }
      return value;
    case "object":
      break;
    default:
      throw new TypeError(`${path}: unsupported ${typeof value} in snapshot`);
  }

  if (Array.isArray(value)) {
    return value.map((item, i) => normalize(item, `${path}[${i}]`));
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new TypeError(`${path}: invalid date in snapshot`);
    }
    return value.toISOString();
  }
  if (isObjectIdLike(value)) return value.toHexString();

  const proto = Object.getPrototypeOf(value) as unknown;
  if (proto !== Object.prototype && proto !== null) {
    throw new TypeError(`${path}: only plain objects can be snapshotted`);
  }
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => [
        key.normalize("NFC"),
        normalize(record[key], `${path}.${key}`),
      ]),
  );
}

function isObjectIdLike(value: object): value is { toHexString(): string } {
  return (
    (value as { _bsontype?: unknown })._bsontype === "ObjectId" &&
    typeof (value as { toHexString?: unknown }).toHexString === "function"
  );
}

export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * SHA-256 of the canonical JSON form, used to fingerprint approval snapshots.
 * Store `SNAPSHOT_HASH_VERSION` alongside it.
 */
export function hashSnapshot(value: unknown): string {
  return sha256(canonicalJson(value));
}
