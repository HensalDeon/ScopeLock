import "server-only";
import { notFound } from "next/navigation";
import { getFreshSession } from "@/shared/auth/session";
import { env } from "@/shared/lib/env";
import { isAdmin, parseAdminEmails } from "../domain/admins";

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
