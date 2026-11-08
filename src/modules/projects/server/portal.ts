import "server-only";
import { env } from "@/shared/lib/env";
import { generateToken, hashToken } from "@/shared/lib/token";
import { decryptText, encryptText } from "@/shared/security/keys";
import type { PortalLink } from "./repository";

/** 32 random bytes, base64url: exactly 43 characters. */
export const PORTAL_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * A new client link. Stored as its hash (to find the project) plus a copy
 * sealed with a key that isn't in the database (so the freelancer can copy
 * the link again later). A database leak alone yields no working links.
 */
export function newPortalLink(): PortalLink {
  const token = generateToken();
  return {
    tokenHash: hashToken(token),
    tokenSealed: encryptText("portal-link-v1", token),
    createdAt: new Date(),
  };
}

/** The full link, or null if the sealed copy can't be opened (secret rotated). */
export function portalUrl(portal: PortalLink): string | null {
  const token = decryptText("portal-link-v1", portal.tokenSealed);
  if (!token || hashToken(token) !== portal.tokenHash) return null;
  return new URL(`/c/${token}`, env().APP_URL).toString();
}
