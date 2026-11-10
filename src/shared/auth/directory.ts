import "server-only";
import type { ObjectId } from "mongodb";
import { collection, COLLECTIONS } from "@/shared/db/collections";
import { paginate, type Page } from "@/shared/lib/pagination";
import { containsPattern } from "@/shared/lib/search";
import { idCandidates } from "./membership";

/**
 * Every workspace, for the platform admin only (callers must have passed
 * requireAdmin). Read-only: business name, type, when it started, and its
 * owner. Reviewed: the one place that lists across workspaces.
 */
export type DirectoryEntry = {
  workspaceId: string;
  businessName: string;
  businessType: string;
  createdAt: Date;
  owner: { name: string; email: string } | null;
};

type ProfileDoc = {
  workspaceId: string;
  businessName: string;
  businessType: string;
  createdAt: Date;
};
type MemberDoc = { userId: unknown; organizationId: unknown; role: string };
type UserDoc = { _id: string | ObjectId; name: string; email: string };

const profiles = () => collection<ProfileDoc>(COLLECTIONS.workspaceProfiles);
const members = () => collection<MemberDoc>(COLLECTIONS.authMember);
const users = () => collection<UserDoc>(COLLECTIONS.authUser);

async function ownersOf(
  workspaceIds: string[],
): Promise<Map<string, { name: string; email: string }>> {
  const owners = await members()
    .find({
      organizationId: { $in: workspaceIds.flatMap(idCandidates) },
      role: /\bowner\b/,
    })
    .toArray();
  const people = await users()
    .find({
      _id: { $in: owners.flatMap((m) => idCandidates(String(m.userId))) },
    })
    .toArray();
  const byId = new Map(people.map((u) => [String(u._id), u]));
  const out = new Map<string, { name: string; email: string }>();
  for (const m of owners) {
    const u = byId.get(String(m.userId));
    if (u && !out.has(String(m.organizationId)))
      out.set(String(m.organizationId), { name: u.name, email: u.email });
  }
  return out;
}

/** Workspaces whose owner's email matches, for an email search. */
async function workspacesOfEmail(term: string): Promise<string[]> {
  const people = await users()
    .find(
      { email: containsPattern(term) },
      { projection: { _id: 1 }, limit: 50 },
    )
    .toArray();
  const ms = await members()
    .find({
      userId: { $in: people.flatMap((u) => idCandidates(String(u._id))) },
    })
    .toArray();
  return ms.map((m) => String(m.organizationId));
}

/**
 * Newest first; search matches the business name, or the owner's email when
 * it has an @. `only` narrows to given workspaces (e.g. those on a given plan).
 */
export async function listWorkspaceDirectory(
  page: number,
  search: string | null,
  only?: readonly string[],
): Promise<Page<DirectoryEntry>> {
  const ids = search?.includes("@") ? await workspacesOfEmail(search) : null;
  const allowed =
    ids && only ? ids.filter((id) => only.includes(id)) : (ids ?? only);
  const filter = {
    ...(allowed ? { workspaceId: { $in: [...allowed] } } : {}),
    ...(search && !search.includes("@")
      ? { businessName: containsPattern(search) }
      : {}),
  };
  const result = await paginate(
    page,
    () => profiles().countDocuments(filter),
    ({ skip, limit }) =>
      profiles()
        .find(filter, { sort: { createdAt: -1, _id: -1 }, skip, limit })
        .toArray(),
  );
  const owners = await ownersOf(result.items.map((p) => p.workspaceId));
  return {
    ...result,
    items: result.items.map((p) => toEntry(p, owners)),
  };
}

export async function findDirectoryEntry(
  workspaceId: string,
): Promise<DirectoryEntry | null> {
  const p = await profiles().findOne({ workspaceId });
  return p ? toEntry(p, await ownersOf([workspaceId])) : null;
}

function toEntry(
  p: ProfileDoc,
  owners: Map<string, { name: string; email: string }>,
): DirectoryEntry {
  return {
    workspaceId: p.workspaceId,
    businessName: p.businessName,
    businessType: p.businessType,
    createdAt: p.createdAt,
    owner: owners.get(p.workspaceId) ?? null,
  };
}
