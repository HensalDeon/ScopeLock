import { describe, expect, it } from "vitest";
import {
  allocate,
  formatINR,
  formatMoney,
  minor,
  paise,
  parseAmount,
  rupeesToPaise,
  sum,
} from "./money";

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

describe("formatMoney (other currencies)", () => {
  it.each([
    ["USD", 1_200_000, "$12,000"],
    ["USD", 1_234_567_800, "$12,345,678"],
    ["EUR", 240_050, "€2,400.50"],
    ["GBP", 99_900, "£999"],
    ["CAD", 95_000, "CA$950"],
    ["AUD", 10_000, "A$100"],
    ["AED", 1_500_000, "AED 15,000"],
    ["SGD", 250_000, "SGD 2,500"],
  ] as const)("%s %i → %s", (currency, amount, expected) => {
    expect(formatMoney(minor(amount), currency).replace(/\s/g, " ")).toBe(
      expected,
    );
  });

  it("keeps Indian grouping only for rupees", () => {
    expect(formatMoney(minor(10_000_000), "INR")).toBe("₹1,00,000");
    expect(formatMoney(minor(10_000_000), "USD")).toBe("$100,000");
  });
});

describe("parseAmount", () => {
  it("accepts the common currency symbols people paste", () => {
    expect(parseAmount("$ 1,250.5")).toBe(125_050);
    expect(parseAmount("€2,400.50")).toBe(240_050);
    // European "2.400" (two thousand four hundred) is ambiguous: rejected,
    // rather than silently read as 2.40.
    expect(() => parseAmount("€2.400")).toThrow(RangeError);
    expect(() => parseAmount("20000x")).toThrow(RangeError);
  });
});
