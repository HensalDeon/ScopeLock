import "server-only";
import { MongoClient, type Db } from "mongodb";
import { env } from "@/shared/lib/env";

/**
 * One MongoClient per server process.
 *
 * The client is created synchronously and connects on its first operation
 * (the driver auto-connects), so it can be handed to libraries that need a
 * `Db` at import time, like Better Auth.
 *
 * In development, Next.js hot-reloads modules, which would otherwise open a
 * new connection pool on every change — so the client is kept on `globalThis`.
 * Works the same on Vercel (serverless) and a long-running Node server (Hostinger).
 */
const globalForMongo = globalThis as unknown as {
  __scopelockMongo?: MongoClient;
};

export function mongoClient(): MongoClient {
  globalForMongo.__scopelockMongo ??= new MongoClient(env().MONGODB_URI, {
    appName: "scopelock",
    maxPoolSize: 10,
  });
  return globalForMongo.__scopelockMongo;
}

export function db(): Db {
  return mongoClient().db(env().MONGODB_DB);
}

/** Round-trips to the database. Used by the health check. */
export async function pingDb(): Promise<{ ok: true; latencyMs: number }> {
  const started = performance.now();
  await db().command({ ping: 1 });
  return { ok: true, latencyMs: Math.round(performance.now() - started) };
}
