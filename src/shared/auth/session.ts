import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./server";

/**
 * Data Access Layer for the signed-in user.
 *
 * Reads request headers, so with Cache Components every caller must render
 * inside a <Suspense> boundary. `cache()` dedupes the lookup per request.
 *
 * Reads may be answered from the signed session cookie (up to 5 minutes old).
 * Anything that changes data must use getFreshSession() instead.
 */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

/**
 * Checks the session against the database, skipping the cookie cache, so a
 * session revoked by a password reset or sign-out elsewhere can't write.
 */
export const getFreshSession = cache(async () =>
  auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  }),
);

export async function requireFreshSession() {
  const session = await getFreshSession();
  if (!session) redirect("/sign-in");
  return session;
}
