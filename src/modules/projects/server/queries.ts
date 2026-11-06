import "server-only";
import { notFound } from "next/navigation";
import type { Client } from "@/modules/clients";
import { getClientsById } from "@/modules/clients/server";
import { requireWorkspace } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import type { Project } from "../domain/project";
import { portalUrl } from "./portal";
import * as repo from "./repository";

export type ProjectWithClient = Project & { client: Client | null };

async function withClients(projects: Project[]): Promise<ProjectWithClient[]> {
  const clients = await getClientsById([
    ...new Set(projects.map((p) => p.clientId)),
  ]);
  return projects.map((p) => ({
    ...p,
    client: clients.get(p.clientId) ?? null,
  }));
}

/** All projects in the workspace, newest activity first, with their client. */
export async function listProjects(): Promise<ProjectWithClient[]> {
  const { workspace } = await requireWorkspace();
  return withClients(await repo.findProjects(workspace.workspaceId));
}

/** Projects for one client (for the client's page). */
export async function listProjectsForClient(
  clientId: string,
): Promise<Project[]> {
  const id = parseObjectId(clientId);
  if (!id) return [];
  const { workspace } = await requireWorkspace();
  return repo.findProjects(workspace.workspaceId, { clientId: id });
}

export async function countProjects(): Promise<number> {
  const { workspace } = await requireWorkspace();
  return repo.countProjects(workspace.workspaceId);
}

/** For actions: the project with its client, or null. */
export async function findProjectWithClient(
  id: string,
): Promise<ProjectWithClient | null> {
  const objectId = parseObjectId(id);
  if (!objectId) return null;
  const { workspace } = await requireWorkspace();
  const project = await repo.findProject(workspace.workspaceId, objectId);
  if (!project) return null;
  const [withClient] = await withClients([project]);
  return withClient ?? null;
}

/** For pages: the project with its client, or the 404 page. */
export async function getProjectOrNotFound(
  id: string,
): Promise<ProjectWithClient> {
  const objectId = parseObjectId(id);
  if (!objectId) notFound();
  const { workspace } = await requireWorkspace();
  const project = await repo.findProject(workspace.workspaceId, objectId);
  if (!project) notFound();
  const [withClient] = await withClients([project]);
  return withClient ?? notFound();
}

export type ShareState = {
  /** The client link, or null if never sent (or it can't be opened). */
  url: string | null;
  hasLink: boolean;
  sentAt: Date | null;
  sentTotal: number | null;
};

/** What the project page needs to share the proposal. */
export async function getShareState(projectId: string): Promise<ShareState> {
  const id = parseObjectId(projectId);
  if (!id) notFound();
  const { workspace } = await requireWorkspace();
  const state = await repo.findPortalState(workspace.workspaceId, id);
  if (!state) notFound();
  return {
    url: state.portal ? portalUrl(state.portal) : null,
    hasLink: Boolean(state.portal),
    sentAt: state.sent?.sentAt ?? null,
    sentTotal: state.sent?.data.total ?? null,
  };
}
