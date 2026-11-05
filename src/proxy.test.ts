import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/auth/server", () => ({ auth: { api: {} } }));

const { config } = await import("./proxy");

/**
 * Next requires the proxy matcher to be a literal list, so it can't be
 * generated from the folder tree. This test does the next best thing: it
 * fails when a signed-in page is added without protecting it in the proxy.
 */
describe("proxy matcher", () => {
  const appRoot = path.join(import.meta.dirname, "app");
  const signedInSections = [
    ...readdirSync(path.join(appRoot, "(app)"), { withFileTypes: true })
      .filter((d) => d.isDirectory() && !/^[_(]/.test(d.name))
      .map((d) => d.name),
    "onboarding",
  ];

  it.each(signedInSections)("protects /%s", (section) => {
    expect(config.matcher).toContain(`/${section}/:path*`);
  });

  it("runs on the auth pages to skip them when signed in", () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining(["/sign-in", "/sign-up"]),
    );
  });
});
