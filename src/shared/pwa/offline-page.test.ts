import { describe, expect, it } from "vitest";
import { markPaths } from "@/shared/ui/brand/geometry";
import { offlineHtml } from "./offline-page";

describe("offlineHtml", () => {
  const html = offlineHtml();
  it("is one self-contained page (nothing to fetch offline)", () => {
    expect(html).not.toMatch(/<link|src="|url\(/);
  });
  it("draws the mark from the shared geometry", () => {
    expect(html).toContain(markPaths.bracketTopLeft);
  });
  it("says what happened and how to recover", () => {
    expect(html).toContain("You're offline");
    expect(html).toContain("Try again");
    expect(html).toContain('addEventListener("online"');
  });
});
