import { describe, expect, it } from "vitest";
import { allocate, formatINR, paise, rupeesToPaise, sum } from "./money";

describe("rupeesToPaise", () => {
  it.each([
    ["80000", 8_000_000],
    ["80,000", 8_000_000],
    ["₹ 1,499.50", 149_950],
    ["0.5", 50],
    ["12.05", 1_205],
    [250, 25_000],
  ])("parses %s", (input, expected) => {
    expect(rupeesToPaise(input)).toBe(expected);
  });

  it.each(["", "abc", "1.234", "1.2.3", "--5"])("rejects %s", (input) => {
    expect(() => rupeesToPaise(input)).toThrow(RangeError);
  });
});

describe("formatINR", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(paise(8_000_000))).toBe("₹80,000");
    expect(formatINR(paise(1_234_567_800))).toBe("₹1,23,45,678");
    expect(formatINR(paise(149_950))).toBe("₹1,499.50");
  });
});

describe("allocate", () => {
  it("splits ₹80,000 into 30/30/40 milestones", () => {
    expect(allocate(paise(8_000_000), [30, 30, 40])).toEqual([
      2_400_000, 2_400_000, 3_200_000,
    ]);
  });

  it("always adds up exactly to the total", () => {
    const parts = allocate(paise(100), [1, 1, 1]);
    expect(parts).toEqual([34, 33, 33]);
    expect(sum(parts)).toBe(100);

    const odd = allocate(paise(1_500_001), [33.33, 33.33, 33.34]);
    expect(sum(odd)).toBe(1_500_001);
  });

  it("rejects invalid weights", () => {
    expect(() => allocate(paise(100), [])).toThrow();
    expect(() => allocate(paise(100), [0, 0])).toThrow();
    expect(() => allocate(paise(100), [-1, 2])).toThrow();
  });
});
