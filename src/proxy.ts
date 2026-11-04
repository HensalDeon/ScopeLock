import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate for signed-in areas: it only checks that a session cookie
 * exists, not that it's valid. Pages and actions still verify the session on
 * the server (src/shared/auth/session.ts).
 *
 * Auth pages are deliberately not redirected here: a stale cookie would bounce
 * between /sign-in and /dashboard forever. They check the real session instead.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/onboarding/:path*"],
};
