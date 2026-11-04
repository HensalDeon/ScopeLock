import "server-only";
import { MongoClient, type Db } from "mongodb";
import { env } from "@/shared/lib/env";

/**
 * One MongoClient per server process.
 *
 * In development, Next.js hot-reloads modules, which would otherwise open a
 * new connection pool on every change — so the client is kept on `globalThis`.
 * Works the same on Vercel (serverless) and a long-running Node server (Hostinger).
 */
const globalForMongo = globalThis as unknown as {
  __scopelockMongo?: Promise<MongoClient>;
};

function connect(): Promise<MongoClient> {
  const client = new MongoClient(env().MONGODB_URI, {
    appName: "scopelock",
    maxPoolSize: 10,
  });
  return client.connect();
}

export function getMongoClient(): Promise<MongoClient> {
  if (!globalForMongo.__scopelockMongo) {
    globalForMongo.__scopelockMongo = connect().catch((error) => {
      // Don't cache a failed connection — let the next call retry.
      globalForMongo.__scopelockMongo = undefined;
      throw error;
    });
  }
  return globalForMongo.__scopelockMongo;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(env().MONGODB_DB);
}

/** Round-trips to the database. Used by the health check. */
export async function pingDb(): Promise<{ ok: true; latencyMs: number }> {
  const db = await getDb();
  const started = performance.now();
  await db.command({ ping: 1 });
  return { ok: true, latencyMs: Math.round(performance.now() - started) };
}
