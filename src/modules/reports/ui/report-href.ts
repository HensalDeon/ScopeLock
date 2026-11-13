import type { Route } from "next";

/** The report's own URL, keeping only what's set. */
export function reportHref(q: {
  fy: number;
  /** By client page. */
  page?: number;
  /** "Not received yet" page. */
  upage?: number;
  /** Narrow "Not received yet" to one client. */
  client?: string | null;
  hash?: string;
}): Route {
  const params = new URLSearchParams({ year: String(q.fy) });
  if (q.page && q.page > 1) params.set("page", String(q.page));
  if (q.client) params.set("client", q.client);
  if (q.upage && q.upage > 1) params.set("upage", String(q.upage));
  return `/reports?${params}${q.hash ? `#${q.hash}` : ""}` as Route;
}
