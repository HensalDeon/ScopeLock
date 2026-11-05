import { afterEach, describe, expect, it, vi } from "vitest";

const BASE = {
  MONGODB_URI: "mongodb://127.0.0.1:27017",
  BETTER_AUTH_SECRET: "x".repeat(32),
};

async function loadEnv(vars: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries({ ...BASE, ...vars })) {
    vi.stubEnv(key, value);
  }
  return import("./env");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("env", () => {
  it("treats empty optional values as unset", async () => {
    const { isGoogleAuthEnabled, isSmtpConfigured } = await loadEnv({
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: " ",
      SMTP_HOST: "",
    });
    expect(isGoogleAuthEnabled()).toBe(false);
    expect(isSmtpConfigured()).toBe(false);
  });

  it("prints emails in development and drops them in production without SMTP", async () => {
    expect((await loadEnv({ NODE_ENV: "development" })).emailTransport()).toBe(
      "console",
    );
    const prod = await loadEnv({
      NODE_ENV: "production",
      APP_URL: "https://scopelock.in",
    });
    expect(prod.emailTransport()).toBe("none");
  });

  it("requires https APP_URL in production, except localhost", async () => {
    const remote = await loadEnv({
      NODE_ENV: "production",
      APP_URL: "http://scopelock.in",
    });
    expect(() => remote.env()).toThrow(/APP_URL must start with https/);
    const local = await loadEnv({
      NODE_ENV: "production",
      APP_URL: "http://localhost:3131",
    });
    expect(() => local.env()).not.toThrow();
  });

  it("refuses console email in production on a real domain", async () => {
    const remote = await loadEnv({
      NODE_ENV: "production",
      APP_URL: "https://scopelock.in",
      EMAIL_TRANSPORT: "console",
    });
    expect(() => remote.env()).toThrow(/production logs/);
  });

  it("rejects a short auth secret", async () => {
    const weak = await loadEnv({ BETTER_AUTH_SECRET: "short" });
    expect(() => weak.env()).toThrow(/at least 32 characters/);
  });
});
