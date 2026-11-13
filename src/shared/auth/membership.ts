import "server-only";
import { ObjectId } from "mongodb";
import { collection, COLLECTIONS } from "@/shared/db/collections";

/** Roles Better Auth's organization plugin assigns to workspace members. */
export const WORKSPACE_ROLES = ["owner", "admin", "member"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

type MemberDoc = {
  userId: string | ObjectId;
  organizationId: string | ObjectId;
  role: string;
  createdAt: Date;
};

const members = () => collection<MemberDoc>(COLLECTIONS.authMember);

/**
 * Better Auth's MongoDB adapter stores references as ObjectId; match both
 * forms so lookups keep working if that ever changes.
 */
export function idCandidates(id: string): (string | ObjectId)[] {
  return /^[0-9a-f]{24}$/i.test(id) ? [id, new ObjectId(id)] : [id];
}

/** The workspace a user lands in: their oldest membership. */
export async function findDefaultWorkspaceId(
  userId: string,
): Promise<string | null> {
  const member = await members().findOne(
    { userId: { $in: idCandidates(userId) } },
    { sort: { createdAt: 1 }, projection: { organizationId: 1 } },
  );
  return member ? String(member.organizationId) : null;
}

/** The user's role in a workspace, or null if they aren't a member. */
export async function getWorkspaceRole(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceRole | null> {
  const member = await members().findOne(
    {
      userId: { $in: idCandidates(userId) },
      organizationId: { $in: idCandidates(workspaceId) },
    },
    { projection: { role: 1 } },
  );
  if (!member) return null;
  // Better Auth stores multiple roles comma-separated; take the strongest.
  const roles = member.role.split(",").map((r) => r.trim());
  return WORKSPACE_ROLES.find((role) => roles.includes(role)) ?? null;
}

// ── Teams (Agency) ─────────────────────────────────────────────────────────
// Reviewed: the only writes to Better Auth's member collection. Callers
// check the actor's role and the plan's seats first (team module).

type UserDoc = {
  _id: string | ObjectId;
  name: string;
  email: string;
  emailVerified?: boolean;
};
const users = () => collection<UserDoc>(COLLECTIONS.authUser);
const asObjectId = (id: string) =>
  /^[0-9a-f]{24}$/i.test(id) ? new ObjectId(id) : id;

export type WorkspaceMember = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: Date;
};

function strongestRole(role: string): WorkspaceRole {
  const roles = role.split(",").map((r) => r.trim());
  return WORKSPACE_ROLES.find((r) => roles.includes(r)) ?? "member";
}

/** Everyone in a workspace, oldest first (the owner usually first). */
export async function listWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const docs = await members()
    .find(
      { organizationId: { $in: idCandidates(workspaceId) } },
      { sort: { createdAt: 1 }, limit: 200 },
    )
    .toArray();
  const people = await users()
    .find({ _id: { $in: docs.flatMap((m) => idCandidates(String(m.userId))) } })
    .toArray();
  const byId = new Map(people.map((u) => [String(u._id), u]));
  return docs.flatMap((m) => {
    const user = byId.get(String(m.userId));
    const id = (m as MemberDoc & { _id?: unknown })._id;
    return user
      ? [
          {
            memberId: String(id),
            userId: String(m.userId),
            name: user.name,
            email: user.email,
            role: strongestRole(m.role),
            joinedAt: m.createdAt,
          },
        ]
      : [];
  });
}

/** Adds someone to a workspace. False if they're already in it. */
export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: Exclude<WorkspaceRole, "owner">,
): Promise<boolean> {
  if (await getWorkspaceRole(userId, workspaceId)) return false;
  await members().insertOne({
    organizationId: asObjectId(workspaceId),
    userId: asObjectId(userId),
    role,
    createdAt: new Date(),
  });
  return true;
}

/** Changes a non-owner's role. False if no such member (or the owner). */
export async function setWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: Exclude<WorkspaceRole, "owner">,
): Promise<boolean> {
  const { matchedCount } = await members().updateOne(
    {
      organizationId: { $in: idCandidates(workspaceId) },
      userId: { $in: idCandidates(userId) },
      role: { $not: /\bowner\b/ },
    },
    { $set: { role } },
  );
  return matchedCount === 1;
}

/** Removes a non-owner from a workspace. False if they weren't in it. */
export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const { deletedCount } = await members().deleteOne({
    organizationId: { $in: idCandidates(workspaceId) },
    userId: { $in: idCandidates(userId) },
    role: { $not: /\bowner\b/ },
  });
  return deletedCount === 1;
}

/** The workspaces someone belongs to, oldest first, with their role. */
export async function listUserWorkspaces(
  userId: string,
): Promise<{ workspaceId: string; role: WorkspaceRole; joinedAt: Date }[]> {
  const docs = await members()
    .find(
      { userId: { $in: idCandidates(userId) } },
      { sort: { createdAt: 1 }, limit: 50 },
    )
    .toArray();
  return docs.map((m) => ({
    workspaceId: String(m.organizationId),
    role: strongestRole(m.role),
    joinedAt: m.createdAt,
  }));
}

/** A signed-in person's account, for accepting an invite. */
export async function findAccount(
  userId: string,
): Promise<{ email: string; name: string; emailVerified: boolean } | null> {
  const user = await users().findOne({ _id: { $in: idCandidates(userId) } });
  return user
    ? {
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified === true,
      }
    : null;
}

/**
 * Confirms someone's email because they opened a team invite sent to it:
 * the one-time link proves the inbox, as the 6-digit code would.
 */
export async function markEmailVerified(userId: string): Promise<void> {
  await users().updateOne(
    { _id: { $in: idCandidates(userId) } },
    { $set: { emailVerified: true } },
  );
}
