/**
 * Creates/updates MongoDB indexes. Idempotent.
 *
 *   npm run db:indexes
 *
 * Reads MONGODB_URI / MONGODB_DB from .env.local (or the environment).
 */
import { MongoClient } from "mongodb";
import { ensureIndexes } from "../src/shared/db/indexes";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  const client = new MongoClient(uri, { appName: "scopelock-scripts" });
  try {
    const database = client.db(process.env.MONGODB_DB || "scopelock");
    const results = await ensureIndexes(database);
    for (const r of results) {
      console.log(`✓ ${r.collection.padEnd(20)} ${r.created.join(", ")}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
