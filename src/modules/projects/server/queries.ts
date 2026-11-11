import "server-only";
import { notFound } from "next/navigation";
import type { Client } from "@/modules/clients";
import { getClientsById, searchClientIds } from "@/modules/clients/server";
import { requireWorkspace } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import { paginate, toPage, type Page } from "@/shared/lib/pagination";
import type { Project } from "../domain/project";
import { portalUrl } from "./portal";
import * as repo from "./repository";
import * as portalRepo from "./portal-repository";

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

/** One page of the workspace's projects, newest activity first, with clients. */
export async function listProjects(
  page: number,
  /** From parseSearch: the project's name or its client's. */
  search: string | null = null,
  archived = false,
): Promise<Page<ProjectWithClient>> {
  const { workspace } = await requireWorkspace();
  const ws = workspace.workspaceId;
  const filter = {
    archived,
    ...(search
      ? { search: { text: search, clientIds: await searchClientIds(search) } }
      : {}),
  };
  const result = await paginate(
    page,
    () => repo.countProjects(ws, filter),
    (window) => repo.findProjects(ws, filter, window),
  );
  return { ...result, items: await withClients(result.items) };
}

/** One page of a client's projects (for the client's page). */
export async function listProjectsForClient(
  clientId: string,
  page: number,
): Promise<Page<Project>> {
  const id = parseObjectId(clientId);
  if (!id) return toPage([], 0, 1);
  const { workspace } = await requireWorkspace();
  const ws = workspace.workspaceId;
  return paginate(
    page,
    () => repo.countProjects(ws, { clientId: id }),
    (window) => repo.findProjects(ws, { clientId: id }, window),
  );
}

/** Projects that could be archived now (for a full plan's notice). */
export async function listArchivable(): Promise<
  { id: string; name: string }[]
> {
  const { workspace } = await requireWorkspace();
  return repo.findArchivable(workspace.workspaceId);
}

/** Archived projects (for the "Archived (3)" link). */
export async function countArchivedProjects(): Promise<number> {
  const { workspace } = await requireWorkspace();
  return repo.countProjects(workspace.workspaceId, { archived: true });
}

export async function countProjects(): Promise<number> {
  const { workspace } = await requireWorkspace();
  return repo.countProjects(workspace.workspaceId);
}

/** Projects per client id (for the clients list). */
export async function countProjectsByClient(): Promise<Map<string, number>> {
  const { workspace } = await requireWorkspace();
  return repo.countProjectsByClient(workspace.workspaceId);
}

export type ProjectSummaryWithClient = repo.ProjectSummary & {
  client: Pick<Client, "name" | "phone" | "email"> | null;
};

/** Light rows for every live project, with client name, phone and email (overview). */
export async function listProjectSummaries(): Promise<
  ProjectSummaryWithClient[]
> {
  const { workspace } = await requireWorkspace();
  const rows = await repo.findProjectSummaries(workspace.workspaceId);
  const clients = await getClientsById([
    ...new Set(rows.map((r) => r.clientId)),
  ]);
  return rows.map((r) => {
    const client = clients.get(r.clientId);
    return {
      ...r,
      client: client
        ? { name: client.name, phone: client.phone, email: client.email }
        : null,
    };
  });
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
  const state = await portalRepo.findPortalState(workspace.workspaceId, id);
  if (!state) notFound();
  return {
    url: state.portal ? portalUrl(state.portal) : null,
    hasLink: Boolean(state.portal),
    sentAt: state.sent?.sentAt ?? null,
    sentTotal: state.sent?.data.total ?? null,
  };
}
