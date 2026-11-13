import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  findDefaultWorkspaceId,
  getWorkspaceRole,
  type WorkspaceRole,
} from "@/shared/auth/membership";
import {
  requireFreshSession,
  requireSession,
  type getSession,
} from "@/shared/auth/session";
import type { WorkspaceProfile } from "../domain/workspace";
import { getWorkspaceProfile } from "./repository";

type SessionData = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export type WorkspaceContext = {
  user: SessionData["user"];
  session: SessionData["session"];
  workspace: WorkspaceProfile;
  role: WorkspaceRole;
};

/**
 * Which workspace this request acts in. The session's active workspace is
 * only trusted after checking the user is still a member of it.
 */
async function resolveMembership(
  userId: string,
  activeWorkspaceId: string | null | undefined,
): Promise<{ workspaceId: string; role: WorkspaceRole } | null> {
  if (activeWorkspaceId) {
    const role = await getWorkspaceRole(userId, activeWorkspaceId);
    if (role) return { workspaceId: activeWorkspaceId, role };
  }
  const fallback = await findDefaultWorkspaceId(userId);
  if (!fallback) return null;
  const role = await getWorkspaceRole(userId, fallback);
  return role ? { workspaceId: fallback, role } : null;
}

async function loadWorkspace({
  user,
  session,
}: SessionData): Promise<WorkspaceContext> {
  const membership = await resolveMembership(
    user.id,
    session.activeOrganizationId,
  );
  if (!membership) redirect("/onboarding");

  const workspace = await getWorkspaceProfile(membership.workspaceId);
  if (!workspace) redirect("/onboarding");

  // Teams: past the plan's people, everyone but the owner and the earliest
  // to join is paused (the team module explains why, and offers a way on).
  // Loaded lazily: the team module itself depends on this one.
  if (membership.role !== "owner") {
    const { memberHasSeat } = await import("@/modules/team/server");
    if (!(await memberHasSeat(membership.workspaceId, user.id)))
      redirect("/team-access");
  }

  return { user, session, workspace, role: membership.role };
}

/**
 * The signed-in user and the workspace they're working in, for pages.
 * - not signed in            → /sign-in
 * - no workspace set up yet  → /onboarding
 */
export const requireWorkspace = cache(async (): Promise<WorkspaceContext> =>
  loadWorkspace(await requireSession()),
);

/**
 * Same, for writes: the session is re-checked against the database instead
 * of the 5-minute cookie cache. Used by workspaceAction().
 */
export const requireWorkspaceForWrite = cache(
  async (): Promise<WorkspaceContext> =>
    loadWorkspace(await requireFreshSession()),
);

/** For onboarding: is the signed-in user's workspace already set up? */
export async function getOnboardingState(options?: { fresh?: boolean }) {
  const { user } = options?.fresh
    ? await requireFreshSession()
    : await requireSession();
  const workspaceId = await findDefaultWorkspaceId(user.id);
  const profile = workspaceId ? await getWorkspaceProfile(workspaceId) : null;
  return { user, workspaceId, isSetUp: Boolean(profile) };
}
