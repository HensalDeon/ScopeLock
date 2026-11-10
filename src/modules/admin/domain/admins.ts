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

export function isAdmin(
  user: { email: string; emailVerified: boolean } | null | undefined,
  admins: readonly string[],
): boolean {
  return Boolean(
    user?.emailVerified && admins.includes(user.email.trim().toLowerCase()),
  );
}
