import "server-only";
import { getWorkspacePlan } from "@/modules/billing/server";
import { listWorkspaceMembers } from "@/shared/auth/membership";
import { withAccess } from "../domain/team";

/**
 * Whether someone (not the owner) has a place on the workspace's plan: the
 * owner, then whoever joined first, up to the plan's people. Read by the
 * workspace context on every request a non-owner makes.
 */
export async function memberHasSeat(
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const [{ plan }, members] = await Promise.all([
    getWorkspacePlan(workspaceId),
    listWorkspaceMembers(workspaceId),
  ]);
  if (members.length <= plan.teamMembers) return true;
  return withAccess(members, plan.teamMembers).has(userId);
}
