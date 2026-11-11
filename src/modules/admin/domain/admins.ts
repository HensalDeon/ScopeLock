/**
 * Platform admins: the confirmed emails listed in ADMIN_EMAILS. Pure, so the
 * rule is tested on its own.
 */
export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

/**
 * The email is on the admin list, confirmed or not yet. For routing an
 * admin-only account (no workspace) to the admin area, where it confirms
 * its email; access itself always needs isAdmin.
 */
export function isListedAdmin(
  email: string | null | undefined,
  admins: readonly string[],
): boolean {
  return Boolean(email && admins.includes(email.trim().toLowerCase()));
}

export function isAdmin(
  user: { email: string; emailVerified: boolean } | null | undefined,
  admins: readonly string[],
): boolean {
  return Boolean(
    user?.emailVerified && admins.includes(user.email.trim().toLowerCase()),
  );
}
