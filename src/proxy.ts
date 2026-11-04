import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/modules/account";
import { auth } from "@/shared/auth/server";

const AUTH_PAGES = new Set(["/sign-in", "/sign-up"]);

/**
 * Runs before every matched request (Node runtime).
 *
 * Signed-in areas: optimistic gate. It only checks that a session cookie
 * exists; pages and actions still verify the session on the server
 * (src/shared/auth/session.ts).
 *
 * Sign-in / sign-up: if the visitor is already signed in, send them into the
 * app before the form renders (no flash of the form). This one checks the
 * real session, not just the cookie, so a stale cookie can't cause a
 * /sign-in ⇄ /dashboard loop. Usually answered from the signed cookie cache
 * without a database read.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const hasCookie = Boolean(getSessionCookie(request));

  if (AUTH_PAGES.has(pathname)) {
    if (!hasCookie) return NextResponse.next();
    const session = await auth.api
      .getSession({ headers: request.headers })
      .catch(() => null);
    if (!session) return NextResponse.next();
    const target =
      pathname === "/sign-in"
        ? safeNextPath(searchParams.get("next"))
        : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (hasCookie) return NextResponse.next();
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
