import "server-only";
import { getWorkspacePlan } from "@/modules/billing/server";
import {
  getWorkspaceProfile,
  requireWorkspace,
} from "@/modules/workspace/server";
import {
  findAccount,
  listUserWorkspaces,
  listWorkspaceMembers,
  type WorkspaceMember,
} from "@/shared/auth/membership";
import { getSession } from "@/shared/auth/session";
import { hashToken } from "@/shared/lib/token";
import { invitationState, sameEmail } from "../domain/invitation";
import {
  canManageTeam,
  placesLeft,
  withAccess,
  type InviteRole,
  type TeamRole,
} from "../domain/team";
import { memberHasSeat } from "./access";
import { findInvitationByTokenHash } from "./invite-lookup";
import { findOpenInvitations } from "./invitations-repository";

export type TeamPage = {
  you: { userId: string; role: TeamRole };
  canManage: boolean;
  plan: { name: string; seats: number };
  members: (WorkspaceMember & { hasAccess: boolean })[];
  invites: {
    id: string;
    email: string;
    role: InviteRole;
    invitedBy: string;
    sentAt: Date;
    expiresAt: Date;
  }[];
  /** Places left for new invites. */
  placesLeft: number;
};

/** Settings → Team. */
export async function getTeamPage(): Promise<TeamPage> {
  const { workspace, user, role } = await requireWorkspace();
  const ws = workspace.workspaceId;
  const now = new Date();
  const [{ plan }, members, invites] = await Promise.all([
    getWorkspacePlan(ws),
    listWorkspaceMembers(ws),
    findOpenInvitations(ws, now),
  ]);
  const access = withAccess(members, plan.teamMembers);
  return {
    you: { userId: user.id, role },
    canManage: canManageTeam(role),
    plan: { name: plan.name, seats: plan.teamMembers },
    members: members.map((m) => ({ ...m, hasAccess: access.has(m.userId) })),
    invites: invites.map((i) => ({
      id: i._id.toHexString(),
      email: i.email,
      role: i.role,
      invitedBy: i.invitedBy.name,
      sentAt: i.createdAt,
      expiresAt: i.expiresAt,
    })),
    placesLeft: placesLeft(plan.teamMembers, members.length, invites.length),
  };
}

export type InvitePage =
  | { kind: "invalid" }
  | { kind: "used" | "expired" | "revoked"; business: string }
  | {
      kind: "open";
      business: string;
      inviter: string;
      role: InviteRole;
      email: string;
      /** Who's signed in, if anyone, and whether they can accept. */
      viewer:
        | { kind: "signed_out" }
        | { kind: "other_email"; email: string }
        | { kind: "unverified"; email: string }
        | { kind: "member" }
        | { kind: "ready" };
      /** The plan has no place left: accepting would fail. */
      full: boolean;
    };

/** /invite/<token>: what the invite is and whether this visitor can use it. */
export async function getInvitePage(token: string): Promise<InvitePage> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return { kind: "invalid" };
  const invite = await findInvitationByTokenHash(hashToken(token));
  if (!invite) return { kind: "invalid" };
  const profile = await getWorkspaceProfile(invite.workspaceId);
  if (!profile) return { kind: "invalid" };
  const business = profile.businessName;
  const state = invitationState(invite, new Date());
  if (state === "accepted") return { kind: "used", business };
  if (state !== "open") return { kind: state, business };

  const [session, { plan }, members] = await Promise.all([
    getSession(),
    getWorkspacePlan(invite.workspaceId),
    listWorkspaceMembers(invite.workspaceId),
  ]);
  const account = session ? await findAccount(session.user.id) : null;
  const viewer: Extract<InvitePage, { kind: "open" }>["viewer"] = !account
    ? { kind: "signed_out" }
    : !sameEmail(account.email, invite.email)
      ? { kind: "other_email", email: account.email }
      : members.some((m) => m.userId === session?.user.id)
        ? { kind: "member" }
        : !account.emailVerified
          ? { kind: "unverified", email: account.email }
          : { kind: "ready" };
  return {
    kind: "open",
    business,
    inviter: invite.invitedBy.name,
    role: invite.role,
    email: invite.email,
    viewer,
    full: members.length >= plan.teamMembers,
  };
}

/** The sidebar's switcher: every workspace the signed-in person is in. */
export async function listMyWorkspaces(): Promise<
  { workspaceId: string; name: string; current: boolean }[]
> {
  const { user, workspace } = await requireWorkspace();
  const mine = await listUserWorkspaces(user.id);
  const profiles = await Promise.all(
    mine.map((m) => getWorkspaceProfile(m.workspaceId)),
  );
  return mine.flatMap((m, i) => {
    const profile = profiles[i];
    return profile
      ? [
          {
            workspaceId: m.workspaceId,
            name: profile.businessName,
            current: m.workspaceId === workspace.workspaceId,
          },
        ]
      : [];
  });
}

export type PausedAccess = {
  business: string;
  owner: string | null;
  plan: { name: string; seats: number };
  /** Other workspaces this person can open instead. */
  others: { workspaceId: string; name: string }[];
};

/**
 * /team-access: why this person's access to their current workspace is
 * paused (the plan allows fewer people), and where else they can go.
 * Null when nothing is paused (they can go back in).
 */
export async function getPausedAccess(): Promise<PausedAccess | null> {
  const session = await getSession();
  if (!session) return null;
  const userId = session.user.id;
  const mine = await listUserWorkspaces(userId);
  const current =
    mine.find((m) => m.workspaceId === session.session.activeOrganizationId) ??
    mine[0];
  if (!current || current.role === "owner") return null;
  const [profile, { plan }, members] = await Promise.all([
    getWorkspaceProfile(current.workspaceId),
    getWorkspacePlan(current.workspaceId),
    listWorkspaceMembers(current.workspaceId),
  ]);
  if (!profile || withAccess(members, plan.teamMembers).has(userId))
    return null;
  const others = await Promise.all(
    mine
      .filter((m) => m.workspaceId !== current.workspaceId)
      .map(async (m) => {
        const [p, open] = await Promise.all([
          getWorkspaceProfile(m.workspaceId),
          m.role === "owner"
            ? Promise.resolve(true)
            : memberHasSeat(m.workspaceId, userId),
        ]);
        return p && open
          ? [{ workspaceId: m.workspaceId, name: p.businessName }]
          : [];
      }),
  );
  return {
    business: profile.businessName,
    owner: members.find((m) => m.role === "owner")?.name ?? null,
    plan: { name: plan.name, seats: plan.teamMembers },
    others: others.flat(),
  };
}
