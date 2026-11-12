/**
 * The app as the browser tests see it: a throwaway in-memory MongoDB
 * (replica set, so transactions work), its indexes, then the production
 * build on :3200. Emails are printed to e2e/.output/server.log (the tests
 * read sign-in codes there); uploads, Google sign-in and Razorpay are off.
 * Never touches a real database.
 *
 *   npm run build && npm run test:e2e
 */
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync, writeFileSync } from "node:fs";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const OUT = new URL("./.output/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: "wiredTiger" },
});
const uri = replSet.getUri();
writeFileSync(new URL("mongo-uri", OUT), uri);

const env = {
  ...process.env,
  NODE_ENV: "production",
  PORT: "3200",
  APP_URL: "http://localhost:3200",
  MONGODB_URI: uri,
  MONGODB_DB: "scopelock-e2e",
  BETTER_AUTH_SECRET:
    process.env.BETTER_AUTH_SECRET ??
    "e2e-placeholder-secret-not-used-anywhere",
  EMAIL_TRANSPORT: "console",
  ADMIN_EMAILS: "e2e-admin@scopelock.test",
  // Set but empty: .env.local can't switch these on for the tests.
  SMTP_HOST: "",
  R2_ACCOUNT_ID: "",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  RAZORPAY_KEY_ID: "",
  RAZORPAY_KEY_SECRET: "",
  RAZORPAY_WEBHOOK_SECRET: "",
  NEXT_TELEMETRY_DISABLED: "1",
};

const run = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { env, stdio: "inherit", ...opts });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)),
    );
  });

await run("npx", ["tsx", "scripts/ensure-indexes.ts"]);

const log = createWriteStream(new URL("server.log", OUT));
const app = spawn("npx", ["next", "start", "-p", "3200"], { env });
app.stdout.pipe(log);
app.stderr.pipe(log);
app.stdout.pipe(process.stdout);

const stop = async () => {
  app.kill("SIGTERM");
  await replSet.stop();
  process.exit(0);
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
app.on("exit", async (code) => {
  await replSet.stop();
  process.exit(code ?? 1);
});
