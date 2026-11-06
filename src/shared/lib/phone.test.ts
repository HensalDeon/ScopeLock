import { describe, expect, it } from "vitest";
import {
  formatPhone,
  normalizePhone,
  optionalPhoneField,
  whatsappLink,
} from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["9876543210", "+919876543210"],
    ["98765 43210", "+919876543210"],
    ["098765-43210", "+919876543210"],
    ["919876543210", "+919876543210"],
    ["+91 98765 43210", "+919876543210"],
    ["+971 50 123 4567", "+971501234567"],
    ["+1 (415) 555-0100", "+14155550100"],
  ])("normalises %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["", "12345", "5876543210", "abc", "+12"])("rejects %s", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("formatPhone", () => {
  it("groups Indian numbers", () => {
    expect(formatPhone("+919876543210")).toBe("+91 98765 43210");
    expect(formatPhone("+971501234567")).toBe("+971501234567");
  });
});

describe("whatsappLink", () => {
  it("builds a wa.me link with an encoded message", () => {
    expect(whatsappLink("+919876543210")).toBe("https://wa.me/919876543210");
    expect(whatsappLink("+919876543210", "Hi Rahul, scope attached")).toBe(
      "https://wa.me/919876543210?text=Hi+Rahul%2C+scope+attached",
    );
  });
});

describe("optionalPhoneField", () => {
  it("treats blank as not provided and normalises the rest", () => {
    expect(optionalPhoneField.parse("  ")).toBeNull();
    expect(optionalPhoneField.parse("98765 43210")).toBe("+919876543210");
    expect(optionalPhoneField.safeParse("12345").success).toBe(false);
  });
});
