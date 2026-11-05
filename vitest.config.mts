import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // `server-only` throws outside a React Server Component bundle; it's a no-op in tests.
      "server-only": path.resolve(
        import.meta.dirname,
        "src/test/server-only-stub.ts",
      ),
    },
  },
  test: {
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.int.test.{ts,tsx}"],
        },
      },
      {
        // Repositories and data rules against a real (in-memory) MongoDB
        // replica set, so transactions work too. First run downloads mongod.
        extends: true,
        test: {
          name: "int",
          include: ["src/**/*.int.test.{ts,tsx}"],
          globalSetup: ["src/test/mongo-global-setup.ts"],
          setupFiles: ["src/test/mongo-env.ts"],
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
