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
 */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}
