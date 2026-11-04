import "server-only";
import { ObjectId } from "mongodb";
import { collection, COLLECTIONS } from "@/shared/db/collections";

/**
 * Better Auth's MongoDB adapter stores references as ObjectId; match both
 * forms so lookups keep working if that ever changes.
 */
export function idCandidates(id: string): (string | ObjectId)[] {
  return ObjectId.isValid(id) ? [id, new ObjectId(id)] : [id];
}

/** The workspace a user lands in: their oldest membership. */
export async function findDefaultWorkspaceId(
  userId: string,
): Promise<string | null> {
  const member = await collection<{
    userId: string | ObjectId;
    organizationId: string | ObjectId;
    createdAt: Date;
  }>(COLLECTIONS.authMember).findOne(
    { userId: { $in: idCandidates(userId) } },
    { sort: { createdAt: 1 }, projection: { organizationId: 1 } },
  );
  return member ? String(member.organizationId) : null;
}

export async function isWorkspaceMember(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const count = await collection(COLLECTIONS.authMember).countDocuments(
    {
      userId: { $in: idCandidates(userId) },
      organizationId: { $in: idCandidates(workspaceId) },
    },
    { limit: 1 },
  );
  return count > 0;
}
