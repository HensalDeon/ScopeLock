import { describe, expect, it } from "vitest";
import { isCompleteCode, normalizeCode } from "./policy";

describe("normalizeCode", () => {
  it.each([
    ["482913", "482913"],
    ["482 913", "482913"],
    ["Code: 482-913", "482913"],
    ["4829131234", "482913"],
    ["abc", ""],
  ])("%s → %s", (raw, expected) => {
    expect(normalizeCode(raw)).toBe(expected);
  });
});

describe("isCompleteCode", () => {
  it("needs exactly six digits", () => {
    expect(isCompleteCode("482913")).toBe(true);
    expect(isCompleteCode("48291")).toBe(false);
    expect(isCompleteCode("48291a")).toBe(false);
    expect(isCompleteCode("4829130")).toBe(false);
  });
});
