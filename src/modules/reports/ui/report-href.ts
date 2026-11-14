import type { Route } from "next";
import type { CurrencyCode } from "@/shared/lib/currency";

/** Each currency's own page numbers: ?p-inr=2 (clients), ?u-inr=2 (unpaid). */
export const clientsParam = (c: CurrencyCode) => `p-${c.toLowerCase()}`;
export const unpaidParam = (c: CurrencyCode) => `u-${c.toLowerCase()}`;

/** The report's own URL, keeping only what's set. */
export function reportHref(q: {
  fy: number;
  /** Narrow "Not received yet" to one client. */
  client?: string | null;
  /** Page numbers by param (from clientsParam / unpaidParam). */
  pages?: Record<string, number>;
  hash?: string;
}): Route {
  const params = new URLSearchParams({ year: String(q.fy) });
  if (q.client) params.set("client", q.client);
  for (const [name, n] of Object.entries(q.pages ?? {}))
    if (n > 1) params.set(name, String(n));
  return `/reports?${params}${q.hash ? `#${q.hash}` : ""}` as Route;
}
