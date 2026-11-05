import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { findDefaultWorkspaceId } from "@/shared/auth/membership";
import { safeNextPath } from "@/shared/auth/redirect";
import { auth } from "@/shared/auth/server";

const AUTH_PAGES = new Set(["/sign-in", "/sign-up"]);
const APP_HOME = "/dashboard";
const ONBOARDING = "/onboarding";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * Routes visitors before anything renders (Node runtime), so nobody sees
 * one page's skeleton and then gets bounced to another:
 *
 * - signed out                      → /sign-in?next=… (auth pages render)
 * - signed in, on sign-in/sign-up   → into the app
 * - signed in, no workspace yet     → /onboarding
 *
 * The session is read from Better Auth's signed cookie cache, so the usual
 * case costs no database call. Only a session without an active workspace
 * checks the database. Pages still verify everything themselves
 * (requireSession / requireWorkspace): this is routing, not authorisation.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const onAuthPage = AUTH_PAGES.has(pathname);

  if (!getSessionCookie(request)) {
    return onAuthPage ? NextResponse.next() : toSignIn(request);
  }

  let session: Session;
  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (error) {
    // Auth or database trouble: let the page render and report it properly
    // instead of misrouting the visitor.
    console.error("[proxy] session lookup failed", error);
    return NextResponse.next();
  }

  if (onAuthPage) {
    // A stale cookie (no valid session) just shows the form: no loop.
    if (!session) return NextResponse.next();
    return redirectTo(request, destinationAfterAuth(request, session));
  }

  if (!session) return toSignIn(request);
  if (session.session.activeOrganizationId) return NextResponse.next();
  return routeWithoutActiveWorkspace(request, session.user.id);
}

function destinationAfterAuth(
  request: NextRequest,
  session: NonNullable<Session>,
): string {
  if (!session.session.activeOrganizationId) return ONBOARDING;
  return request.nextUrl.pathname === "/sign-in"
    ? safeNextPath(request.nextUrl.searchParams.get("next"), APP_HOME)
    : APP_HOME;
}

/**
 * The session doesn't name a workspace. Either the user hasn't created one
 * (→ onboarding), or the session predates it: created in another tab or
 * device, or the cookie cache hasn't caught up. Then record it on the
 * session and continue, so the next request takes the fast path.
 */
async function routeWithoutActiveWorkspace(
  request: NextRequest,
  userId: string,
): Promise<NextResponse> {
  const onOnboarding =
    request.nextUrl.pathname === ONBOARDING ||
    request.nextUrl.pathname.startsWith(`${ONBOARDING}/`);
  try {
    const workspaceId = await findDefaultWorkspaceId(userId);
    if (!workspaceId) {
      return onOnboarding
        ? NextResponse.next()
        : redirectTo(request, ONBOARDING);
    }
    const { headers } = await auth.api.setActiveOrganization({
      body: { organizationId: workspaceId },
      headers: request.headers,
      returnHeaders: true,
    });
    const response = NextResponse.next();
    for (const cookie of headers.getSetCookie()) {
      response.headers.append("set-cookie", cookie);
    }
    return response;
  } catch (error) {
    console.error("[proxy] workspace lookup failed", error);
    return NextResponse.next();
  }
}

function toSignIn(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url));
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/clients/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
