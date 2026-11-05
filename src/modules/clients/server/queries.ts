import "server-only";
import { notFound } from "next/navigation";
import { requireWorkspace } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import type { Client } from "../domain/client";
import * as repo from "./repository";

/*
 * Queries for pages and other modules. The workspace always comes from the
 * signed-in session (requireWorkspace, cached per request), never from the
 * caller, so a page can't accidentally read another workspace's clients.
 */

export async function listClients(options?: {
  archived?: boolean;
}): Promise<Client[]> {
  const { workspace } = await requireWorkspace();
  return repo.findClients(workspace.workspaceId, options);
}

export async function countClients(): Promise<number> {
  const { workspace } = await requireWorkspace();
  return repo.countActiveClients(workspace.workspaceId);
}

/** The client, or null if the id is malformed or not in this workspace. */
export async function findClient(id: string): Promise<Client | null> {
  const objectId = parseObjectId(id);
  if (!objectId) return null;
  const { workspace } = await requireWorkspace();
  return repo.findClient(workspace.workspaceId, objectId);
}

/** Clients by id (archived included), keyed by id. Unknown ids are skipped. */
export async function getClientsById(
  ids: readonly string[],
): Promise<Map<string, Client>> {
  const objectIds = ids
    .map((id) => parseObjectId(id))
    .filter((id) => id !== null);
  const { workspace } = await requireWorkspace();
  const found = await repo.findClientsByIds(workspace.workspaceId, objectIds);
  return new Map(found.map((client) => [client.id, client]));
}

/** For pages: the client, or the 404 page. */
export async function getClientOrNotFound(id: string): Promise<Client> {
  return (await findClient(id)) ?? notFound();
}
