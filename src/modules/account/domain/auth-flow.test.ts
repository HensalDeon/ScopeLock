import { describe, expect, it } from "vitest";
import { authErrorMessage, safeNextPath } from "./auth-flow";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/settings")).toBe("/settings");
    expect(safeNextPath("/dashboard?tab=1")).toBe("/dashboard?tab=1");
  });

  it.each([
    null,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "/ok\r\nSet-Cookie: x",
  ])("falls back for %s", (input) => {
    expect(safeNextPath(input)).toBe("/dashboard");
  });
});

describe("authErrorMessage", () => {
  it("maps known codes", () => {
    expect(authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toMatch(
      /don't match/,
    );
  });

  it("treats 429 as rate limiting", () => {
    expect(authErrorMessage({ status: 429 })).toMatch(/Too many attempts/);
  });

  it("has a generic fallback", () => {
    expect(authErrorMessage({ code: "SOMETHING_NEW" })).toMatch(
      /Something went wrong/,
    );
    expect(authErrorMessage(null)).toMatch(/Something went wrong/);
  });
});
