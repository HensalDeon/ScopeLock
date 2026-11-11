import "server-only";
import { getWorkspacePlan } from "@/modules/billing/server";
import { projectLimitReached } from "../domain/archive";
import { countActiveProjects } from "./repository";

/**
 * Whether the workspace's plan has room for one more active project; null
 * if it has, else what to say. Two creates at the same instant could both
 * pass; the limit is a plan rule, not a security boundary.
 */
export async function projectLimitMessage(
  workspaceId: string,
  to?: "start a new one" | "restore this one",
): Promise<string | null> {
  const [{ plan }, active] = await Promise.all([
    getWorkspacePlan(workspaceId),
    countActiveProjects(workspaceId),
  ]);
  return projectLimitReached({
    active,
    limit: plan.activeProjects,
    planName: plan.name,
    to,
  });
}
