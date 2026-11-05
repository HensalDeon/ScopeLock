import "server-only";
import type { ClientSession } from "mongodb";
import { mongoClient } from "./client";

/**
 * Runs `work` in a MongoDB transaction: every write passed `{ session }`
 * commits together or not at all. Use it whenever one user action writes
 * more than one document that must agree (approval record + status change +
 * payment line). The driver retries transient errors, so `work` must be safe
 * to run more than once (no emails or other side effects inside it).
 */
export async function withTransaction<T>(
  work: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = mongoClient().startSession();
  try {
    return await session.withTransaction(work);
  } finally {
    await session.endSession();
  }
}
