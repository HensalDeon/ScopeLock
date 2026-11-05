/**
 * Account security limits, shared by the auth server, email templates and
 * forms so the numbers never disagree. Client-safe (no secrets here).
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// One-time email codes (verify email, reset password).
export const CODE_LENGTH = 6;
export const CODE_TTL_MINUTES = 10;
/** Wrong guesses allowed per code before a new one is needed. */
export const CODE_MAX_ATTEMPTS = 5;
/** How long the "Send a new code" button waits between sends. */
export const CODE_RESEND_SECONDS = 30;

/** Keep digits only, so pasted "482 913" or "Code: 482913" still works. */
export function normalizeCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

export function isCompleteCode(code: string): boolean {
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code);
}
