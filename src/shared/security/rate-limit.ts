import "server-only";
import { collection } from "@/shared/db/collections";
import { COLLECTIONS } from "@/shared/db/names";

type LimitDoc = { _id: string; count: number; expiresAt: Date };

/**
 * Fixed-window rate limit stored in MongoDB, so it holds across serverless
 * instances. `key` names who and what ("portal-view:<ip>"). Counters expire
 * on their own (TTL index on expiresAt).
 */
export async function rateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
): Promise<{ allowed: boolean }> {
  const windowMs = windowSeconds * 1000;
  const bucket = Math.floor(Date.now() / windowMs);
  const doc = await collection<LimitDoc>(
    COLLECTIONS.requestLimits,
  ).findOneAndUpdate(
    { _id: `${key}:${bucket}` },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((bucket + 1) * windowMs) },
    },
    { upsert: true, returnDocument: "after" },
  );
  return { allowed: (doc?.count ?? 1) <= limit };
}
