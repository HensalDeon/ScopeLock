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
