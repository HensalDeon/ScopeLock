import "server-only";
import { findClientInWorkspace } from "@/modules/clients/server";
import { parseObjectId } from "@/shared/db/ids";
import type { CurrencyCode } from "@/shared/lib/currency";
import { portalUrl } from "./portal";
import { findPortalState } from "./portal-repository";
import { findProject } from "./repository";

export type ReminderTarget = {
  name: string;
  currency: CurrencyCode;
  archived: boolean;
  client: { name: string; email: string | null } | null;
  /** The client's private link, or null if it can't be rebuilt. */
  portalUrl: string | null;
};

/**
 * For jobs that run without a signed-in member (the daily reminder run):
 * a project, its client and the client's link, in the given workspace.
 */
export async function findReminderTarget(
  workspaceId: string,
  projectId: string,
): Promise<ReminderTarget | null> {
  const id = parseObjectId(projectId);
  if (!id) return null;
  const [project, state] = await Promise.all([
    findProject(workspaceId, id),
    findPortalState(workspaceId, id),
  ]);
  if (!project) return null;
  const clientId = parseObjectId(project.clientId);
  const client = clientId
    ? await findClientInWorkspace(workspaceId, clientId)
    : null;
  return {
    name: project.name,
    currency: project.currency,
    archived: project.archivedAt !== null,
    client: client ? { name: client.name, email: client.email } : null,
    portalUrl: state?.portal ? portalUrl(state.portal) : null,
  };
}
