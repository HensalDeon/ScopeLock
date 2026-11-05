import type { Db, IndexDescription } from "mongodb";
import { COLLECTIONS, type CollectionName } from "./names";

/**
 * Index definitions for every collection. Applied by `npm run db:indexes`
 * (idempotent — safe to run on every deploy).
 */
export const INDEXES: Partial<Record<CollectionName, IndexDescription[]>> = {
  [COLLECTIONS.authUser]: [{ key: { email: 1 }, unique: true }],
  [COLLECTIONS.authSession]: [
    { key: { token: 1 }, unique: true },
    { key: { userId: 1 } },
    // MongoDB removes expired sessions on its own.
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ],
  [COLLECTIONS.authAccount]: [
    { key: { userId: 1 } },
    { key: { providerId: 1, accountId: 1 } },
  ],
  [COLLECTIONS.authVerification]: [
    { key: { identifier: 1 } },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  ],
  [COLLECTIONS.authOrganization]: [{ key: { slug: 1 }, unique: true }],
  [COLLECTIONS.authMember]: [
    { key: { organizationId: 1, userId: 1 }, unique: true },
    { key: { userId: 1 } },
  ],
  [COLLECTIONS.authInvitation]: [
    { key: { organizationId: 1 } },
    { key: { email: 1 } },
  ],
  [COLLECTIONS.authRateLimit]: [{ key: { key: 1 }, unique: true }],

  [COLLECTIONS.workspaceProfiles]: [{ key: { workspaceId: 1 }, unique: true }],

  // Business data: every index starts with workspaceId (see CONVENTIONS §2).
  [COLLECTIONS.clients]: [
    { key: { workspaceId: 1, archivedAt: 1, nameLower: 1 } },
  ],
  [COLLECTIONS.documentSettings]: [{ key: { workspaceId: 1 }, unique: true }],
  [COLLECTIONS.projects]: [
    { key: { workspaceId: 1, updatedAt: -1 } },
    { key: { workspaceId: 1, clientId: 1, updatedAt: -1 } },
  ],
};

export async function ensureIndexes(
  database: Db,
): Promise<{ collection: string; created: string[] }[]> {
  const results = [];
  for (const [name, specs] of Object.entries(INDEXES)) {
    if (!specs?.length) continue;
    const created = await database.collection(name).createIndexes(specs);
    results.push({ collection: name, created });
  }
  return results;
}
