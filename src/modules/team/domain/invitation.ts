/** Team invitations: a link that works once, for one email, for 7 days. */
export const INVITE_TTL_DAYS = 7;

export type InvitationState = "open" | "expired" | "accepted" | "revoked";

export function invitationState(
  invite: { expiresAt: Date; acceptedAt: Date | null; revokedAt: Date | null },
  now: Date,
): InvitationState {
  if (invite.acceptedAt) return "accepted";
  if (invite.revokedAt) return "revoked";
  return invite.expiresAt > now ? "open" : "expired";
}

export function inviteExpiry(from: Date): Date {
  return new Date(from.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** The signed-in email matches the invite (case and spaces aside). */
export function sameEmail(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
