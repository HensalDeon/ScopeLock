import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  findDefaultWorkspaceId,
  isWorkspaceMember,
} from "@/shared/auth/membership";
import { requireSession } from "@/shared/auth/session";
import { getWorkspaceProfile } from "./repository";

/**
 * The signed-in user and the workspace they're working in.
 * Every page and action inside the app goes through this.
 *
 * - not signed in            → /sign-in
 * - no workspace set up yet  → /onboarding
 */
export const requireWorkspace = cache(async () => {
  const { user, session } = await requireSession();

  let workspaceId = session.activeOrganizationId ?? null;
  if (workspaceId && !(await isWorkspaceMember(user.id, workspaceId))) {
    workspaceId = null;
  }
  workspaceId ??= await findDefaultWorkspaceId(user.id);
  if (!workspaceId) redirect("/onboarding");

  const workspace = await getWorkspaceProfile(workspaceId);
  if (!workspace) redirect("/onboarding");

  return { user, session, workspace };
});

export type WorkspaceContext = Awaited<ReturnType<typeof requireWorkspace>>;
