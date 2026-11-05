import { describe, expect, it } from "vitest";
import { workspaceDetailsSchema, workspaceSlug } from "./workspace";

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
      // Not asked at onboarding: defaults to rupees.
      currency: "INR",
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
