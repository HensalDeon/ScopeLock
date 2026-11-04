/**
 * Where to send someone after signing in. Only same-site paths are allowed,
 * so a crafted ?next=https://evil.example link can't redirect off ScopeLock.
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }
  if (/[\r\n\t]/.test(raw)) return fallback;
  return raw;
}

/** Better Auth error codes → what we tell the person, and what to do next. */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD:
    "That email and password don't match. Check for typos, or reset your password.",
  USER_ALREADY_EXISTS:
    "There's already an account with this email. Sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "There's already an account with this email. Sign in instead.",
  PASSWORD_TOO_SHORT: "Use at least 8 characters for your password.",
  PASSWORD_TOO_LONG: "Use 128 characters or fewer for your password.",
  INVALID_EMAIL: "That doesn't look like an email address.",
  INVALID_TOKEN:
    "This link has expired or was already used. Ask for a new one below.",
  TOO_MANY_REQUESTS:
    "Too many attempts in a short time. Wait a minute, then try again.",
};

export function authErrorMessage(
  error: { code?: string; status?: number } | null | undefined,
): string {
  if (error?.status === 429) return MESSAGES.TOO_MANY_REQUESTS;
  if (error?.code && MESSAGES[error.code]) return MESSAGES[error.code];
  return "Something went wrong on our side. Please try again.";
}
