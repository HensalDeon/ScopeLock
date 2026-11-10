import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/shared/auth/policy";

/** Better Auth error codes → what we tell the person, and what to do next. */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD:
    "That email and password don't match. Check for typos, or reset your password.",
  USER_ALREADY_EXISTS:
    "There's already an account with this email. Sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "There's already an account with this email. Sign in instead.",
  PASSWORD_TOO_SHORT: `Use at least ${PASSWORD_MIN_LENGTH} characters for your password.`,
  PASSWORD_TOO_LONG: `Use ${PASSWORD_MAX_LENGTH} characters or fewer for your password.`,
  INVALID_EMAIL: "That doesn't look like an email address.",
  INVALID_OTP:
    "That code isn't right. Check the latest email from ScopeLock and try again.",
  OTP_EXPIRED: "This code has expired. Send a new one and use that instead.",
  TOO_MANY_ATTEMPTS:
    "Too many wrong codes. Send a new one and use that instead.",
};

const TOO_MANY_REQUESTS =
  "Too many attempts in a short time. Wait a minute, then try again.";

/** The request never reached ScopeLock (offline, flaky network). */
export const NETWORK_ERROR =
  "Couldn't reach ScopeLock. Check your connection and try again.";

export function authErrorMessage(
  error: { code?: string; status?: number } | null | undefined,
): string {
  if (error?.status === 429) return TOO_MANY_REQUESTS;
  const known = error?.code ? MESSAGES[error.code] : undefined;
  if (known) return known;
  if (error?.status === 0) return NETWORK_ERROR;
  // An unknown 4xx is about what was entered, not a fault on our side.
  if (error?.status && error.status >= 400 && error.status < 500)
    return "That didn't go through. Check what you entered and try again.";
  return "Something went wrong on our side. Please try again.";
}

/**
 * The email typed on the landing page (`/sign-up?email=…`), to fill in the
 * sign-up form. Anything that doesn't look like one address is dropped.
 */
export function prefillEmail(raw: string | string[] | undefined): string {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  return value.length <= 254 && /^[^\s@]+@[^\s@]+$/.test(value) ? value : "";
}
