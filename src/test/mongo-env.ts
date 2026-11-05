import { randomUUID } from "node:crypto";
import { afterAll, inject } from "vitest";

// Runs before each integration test file's imports, so env() sees these.
// Each file gets its own database, so files can run in parallel.
process.env.MONGODB_URI = inject("mongoUri");
process.env.MONGODB_DB = `test_${randomUUID().slice(0, 8)}`;
process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret-00";

afterAll(async () => {
  const { mongoClient } = await import("@/shared/db/client");
  await mongoClient().db(process.env.MONGODB_DB).dropDatabase();
  await mongoClient().close();
});
