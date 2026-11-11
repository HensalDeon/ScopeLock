import "server-only";
import { notFound } from "next/navigation";
import { getFreshSession } from "@/shared/auth/session";
import { env } from "@/shared/lib/env";
import { findDefaultWorkspaceId } from "@/shared/auth/membership";
import { isAdmin, isListedAdmin, parseAdminEmails } from "../domain/admins";

export type AdminContext = { email: string; userId: string; name: string };

/**
 * The platform admin for this request, checked against the database (not
 * the cookie cache) every time. Anyone else, signed in or not, gets the
 * same not-found page: the admin area isn't revealed.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const session = await getFreshSession();
  if (!session || !isAdmin(session.user, parseAdminEmails(env().ADMIN_EMAILS)))
    notFound();
  return {
    email: session.user.email.toLowerCase(),
    userId: session.user.id,
    name: session.user.name,
  };
}

export type AdminAccess =
  | { kind: "admin"; admin: AdminContext; hasWorkspace: boolean }
  /** A listed admin email that isn't confirmed yet: confirm it first. */
  | { kind: "confirm"; email: string };

/**
 * For the admin area's frame: a confirmed admin gets in; a listed email
 * that isn't confirmed yet is asked for its code (only listed emails ever
 * see that, so the area stays hidden); anyone else gets not found.
 */
export async function getAdminAccess(): Promise<AdminAccess> {
  const session = await getFreshSession();
  const admins = parseAdminEmails(env().ADMIN_EMAILS);
  if (session && isAdmin(session.user, admins))
    return {
      kind: "admin",
      admin: {
        email: session.user.email.toLowerCase(),
        userId: session.user.id,
        name: session.user.name,
      },
      hasWorkspace: Boolean(await findDefaultWorkspaceId(session.user.id)),
    };
  if (session && isListedAdmin(session.user.email, admins))
    return { kind: "confirm", email: session.user.email };
  notFound();
}

/** For links in the app (shows "Admin" only to admins). Never throws. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await getFreshSession();
  return isAdmin(session?.user, parseAdminEmails(env().ADMIN_EMAILS));
}

/** For the app menu's "Admin" link, from a session already in hand. */
export function canSeeAdmin(
  user: { email: string; emailVerified: boolean } | null | undefined,
): boolean {
  return isAdmin(user, parseAdminEmails(env().ADMIN_EMAILS));
}
