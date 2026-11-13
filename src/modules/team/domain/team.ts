import { z } from "zod";

/**
 * Teams (Agency): who can do what, and who keeps access when the plan
 * allows fewer people than the workspace has.
 *
 * - Owner: everything, including the plan, admins and removing anyone.
 * - Admin: settings and the team, but can invite and remove only members.
 * - Member: all project work (proposals, changes, payments); no settings,
 *   plan or team changes.
 */
export const TEAM_ROLES = ["owner", "admin", "member"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];
/** Roles someone can be invited as, or changed to. */
export const INVITE_ROLES = ["admin", "member"] as const;
export type InviteRole = (typeof INVITE_ROLES)[number];

export const ROLE_LABELS: Record<TeamRole, { title: string; detail: string }> =
  {
    owner: {
      title: "Owner",
      detail: "Everything, including the plan and who's an admin.",
    },
    admin: {
      title: "Admin",
      detail: "Project work and settings; invites and removes members.",
    },
    member: {
      title: "Member",
      detail:
        "Project work: proposals, change requests and payments. Settings are read-only.",
    },
  };

export function canManageTeam(role: TeamRole): boolean {
  return role === "owner" || role === "admin";
}

/** Only the owner makes admins; admins invite members. */
export function canInviteAs(actor: TeamRole, role: InviteRole): boolean {
  return actor === "owner" || (actor === "admin" && role === "member");
}

/** Changing someone's role: only the owner, and never the owner's own. */
export function canChangeRole(actor: TeamRole, target: TeamRole): boolean {
  return actor === "owner" && target !== "owner";
}

/** Owner removes anyone else; admins remove members only. */
export function canRemove(actor: TeamRole, target: TeamRole): boolean {
  if (target === "owner") return false;
  return actor === "owner" || (actor === "admin" && target === "member");
}

/**
 * Who has access when the plan allows `seats` people: the owner, then
 * whoever joined first. Everyone else is paused until the plan allows more
 * (or someone is removed).
 */
export function withAccess<
  T extends { userId: string; role: TeamRole; joinedAt: Date },
>(members: readonly T[], seats: number): Set<string> {
  const ordered = [...members].sort(
    (a, b) =>
      Number(b.role === "owner") - Number(a.role === "owner") ||
      a.joinedAt.getTime() - b.joinedAt.getTime(),
  );
  return new Set(ordered.slice(0, Math.max(1, seats)).map((m) => m.userId));
}

/** Places left for new invites: people plus invites still open. */
export function placesLeft(
  seats: number,
  members: number,
  openInvites: number,
): number {
  return Math.max(0, seats - members - openInvites);
}

export const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Add the email they'll sign in with.")
    .max(254, "That email address is too long.")
    .refine((v) => z.email().safeParse(v).success, {
      message: "That doesn't look like an email address.",
    }),
  role: z.enum(INVITE_ROLES, { message: "Choose admin or member." }),
});
export const INVITE_FIELDS = ["email", "role"] as const;
