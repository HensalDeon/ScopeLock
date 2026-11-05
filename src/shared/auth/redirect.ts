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
