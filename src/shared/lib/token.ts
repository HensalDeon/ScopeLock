import { randomBytes, timingSafeEqual } from "node:crypto";
import { sha256 } from "./hash";

/**
 * Secret link tokens (client portal, approval links).
 *
 * The raw token goes in the URL sent to the client; only its SHA-256 hash is
 * stored in the database, so a database leak doesn't expose working links.
 */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return sha256(token);
}

export function tokenMatchesHash(token: string, storedHash: string): boolean {
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
