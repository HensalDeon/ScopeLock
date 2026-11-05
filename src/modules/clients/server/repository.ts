import "server-only";
import type { ObjectId } from "mongodb";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection, type WorkspaceOwned } from "@/shared/db/scoped";
import type { Client, ClientInput } from "../domain/client";

type ClientDoc = WorkspaceOwned &
  ClientInput & {
    _id: ObjectId;
    /** For case-insensitive sorting by name. */
    nameLower: string;
    archivedAt: Date | null;
  };

const clients = (workspaceId: string) =>
  scopedCollection<ClientDoc>(COLLECTIONS.clients, workspaceId);

function toClient(doc: ClientDoc): Client {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    company: doc.company ?? null,
    email: doc.email ?? null,
    phone: doc.phone ?? null,
    currency: doc.currency ?? null,
    archivedAt: doc.archivedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function findClients(
  workspaceId: string,
  { archived = false }: { archived?: boolean } = {},
): Promise<Client[]> {
  const docs = await clients(workspaceId)
    .find(
      { archivedAt: archived ? { $ne: null } : null },
      { sort: { nameLower: 1 } },
    )
    .toArray();
  return docs.map(toClient);
}

export async function findClient(
  workspaceId: string,
  id: ObjectId,
): Promise<Client | null> {
  const doc = await clients(workspaceId).findOne({ _id: id });
  return doc ? toClient(doc) : null;
}

/** Includes archived clients: old projects still show who they were for. */
export async function findClientsByIds(
  workspaceId: string,
  ids: readonly ObjectId[],
): Promise<Client[]> {
  if (ids.length === 0) return [];
  const docs = await clients(workspaceId)
    .find({ _id: { $in: [...ids] } })
    .toArray();
  return docs.map(toClient);
}

export async function countActiveClients(workspaceId: string): Promise<number> {
  return clients(workspaceId).countDocuments({ archivedAt: null });
}

export async function insertClient(
  workspaceId: string,
  input: ClientInput,
): Promise<string> {
  const { insertedId } = await clients(workspaceId).insertOne({
    ...input,
    nameLower: input.name.toLowerCase(),
    archivedAt: null,
  });
  return insertedId.toHexString();
}

/** Returns false if no such client exists in this workspace. */
export async function updateClient(
  workspaceId: string,
  id: ObjectId,
  input: ClientInput,
): Promise<boolean> {
  const { matchedCount } = await clients(workspaceId).updateOne(
    { _id: id },
    { $set: { ...input, nameLower: input.name.toLowerCase() } },
  );
  return matchedCount === 1;
}

export async function setClientArchived(
  workspaceId: string,
  id: ObjectId,
  archived: boolean,
): Promise<boolean> {
  const { matchedCount } = await clients(workspaceId).updateOne(
    { _id: id },
    { $set: { archivedAt: archived ? new Date() : null } },
  );
  return matchedCount === 1;
}
