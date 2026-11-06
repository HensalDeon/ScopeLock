import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { env } from "@/shared/lib/env";

/**
 * Purpose-bound keys derived (HKDF-SHA256) from BETTER_AUTH_SECRET, so each
 * use has its own key and no extra secret has to be managed. The derived keys
 * never touch the database: someone who can read or write the database still
 * can't decrypt portal links or forge an evidence signature.
 *
 * Rotating BETTER_AUTH_SECRET makes stored portal links unreadable (people get
 * a new link) and needs the old secret to re-verify old evidence signatures.
 */
export type KeyPurpose = "portal-link-v1" | "evidence-v1";

const cache = new Map<KeyPurpose, Buffer>();

function key(purpose: KeyPurpose): Buffer {
  let derived = cache.get(purpose);
  if (!derived) {
    derived = Buffer.from(
      hkdfSync("sha256", env().BETTER_AUTH_SECRET, "scopelock", purpose, 32),
    );
    cache.set(purpose, derived);
  }
  return derived;
}

/** AES-256-GCM. Output: "v1.<iv>.<tag>.<ciphertext>", all base64url. */
export function encryptText(purpose: KeyPurpose, plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(purpose), iv);
  const data = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    data.toString("base64url"),
  ].join(".");
}

/** The plaintext, or null if the payload was tampered with or the key changed. */
export function decryptText(
  purpose: KeyPurpose,
  payload: string,
): string | null {
  const [version, iv, tag, data] = payload.split(".");
  if (version !== "v1" || !iv || !tag || !data) return null;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key(purpose),
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

/** HMAC-SHA256 signature (hex) over `data`. */
export function sign(purpose: KeyPurpose, data: string): string {
  return createHmac("sha256", key(purpose)).update(data, "utf8").digest("hex");
}

export function verifySignature(
  purpose: KeyPurpose,
  data: string,
  signature: string,
): boolean {
  const expected = Buffer.from(sign(purpose, data), "hex");
  const given = Buffer.from(signature, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}
