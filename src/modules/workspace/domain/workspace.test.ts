import { describe, expect, it } from "vitest";
import {
  formatPhone,
  normalizePhone,
  workspaceDetailsSchema,
  workspaceSlug,
} from "./workspace";

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

describe("workspaceSlug", () => {
  it("builds a url-safe slug", () => {
    expect(workspaceSlug("Pixel & Code Studio", "a1b2")).toBe(
      "pixel-and-code-studio-a1b2",
    );
    expect(workspaceSlug("  Café Désign!! ", "x9")).toBe("cafe-design-x9");
    expect(workspaceSlug("!!!", "x9")).toBe("workspace-x9");
  });
});

describe("workspaceDetailsSchema", () => {
  it("accepts valid details and normalises the phone", () => {
    const result = workspaceDetailsSchema.parse({
      businessName: "  Hensal Deon ",
      businessType: "freelancer",
      phone: "98765 43210",
    });
    expect(result).toEqual({
      businessName: "Hensal Deon",
      businessType: "freelancer",
      phone: "+919876543210",
    });
  });

  it("treats an empty phone as not provided", () => {
    const result = workspaceDetailsSchema.parse({
      businessName: "Studio",
      businessType: "studio",
      phone: "",
    });
    expect(result.phone).toBeNull();
  });

  it("explains what's wrong", () => {
    const result = workspaceDetailsSchema.safeParse({
      businessName: "A",
      businessType: "",
      phone: "123",
    });
    expect(result.success).toBe(false);
    const messages = result.error!.issues.map((i) => i.message);
    expect(messages).toContain("Enter at least 2 characters.");
    expect(messages).toContain("Choose how you work.");
    expect(messages).toContain(
      "Enter a 10-digit mobile number, or include the country code.",
    );
  });
});
