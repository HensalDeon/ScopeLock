/**
 * List search (clients, projects): what was typed, made safe to match on.
 * Plain substring matching, case-insensitive; the workspace filter is
 * applied separately by the repository, as for every query.
 */

/** Longest search kept; anything past it is ignored. */
export const SEARCH_MAX_LENGTH = 60;

/** `?q=` → the term to search for, or null for no search. */
export function parseSearch(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  const term = raw.replace(/\s+/g, " ").trim().slice(0, SEARCH_MAX_LENGTH);
  return term || null;
}

/** "Mehta (Interiors)" → /Mehta \(Interiors\)/i: a substring, never a pattern. */
export function containsPattern(term: string): RegExp {
  return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

/**
 * A search that looks like part of a phone number ("98765 43210") → its
 * digits, to match stored numbers like +919876543210. Null otherwise.
 */
export function phoneDigits(term: string): string | null {
  if (!/^[\d\s+()-]+$/.test(term)) return null;
  const digits = term.replace(/\D/g, "");
  return digits.length >= 4 ? digits : null;
}

/** A list URL with its search and page, leaving out empty values. */
export function listHref(
  path: string,
  params: Record<string, string | number | null | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    if (key === "page" && Number(value) === 1) continue;
    query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}
