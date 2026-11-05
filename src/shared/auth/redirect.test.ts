import { describe, expect, it } from "vitest";
import { safeNextPath } from "./redirect";

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
