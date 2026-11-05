import { z } from "zod";
import { describe, expect, it } from "vitest";
import { hasChanges, validate } from "./form-validation";
import { optionalPhoneField } from "./phone";

const schema = z.object({
  name: z.string().trim().min(2, "Too short"),
  phone: optionalPhoneField,
});

describe("validate", () => {
  it("returns field errors, or none when valid", () => {
    expect(validate(schema, { name: "R", phone: "" })).toEqual({
      name: "Too short",
    });
    expect(validate(schema, { name: "Rahul", phone: "98765 43210" })).toEqual(
      {},
    );
  });
});

describe("hasChanges", () => {
  const saved = { name: "Rahul Mehta", phone: "+91 98765 43210" };

  it("ignores formatting-only differences", () => {
    expect(
      hasChanges(schema, { name: " Rahul Mehta ", phone: "9876543210" }, saved),
    ).toBe(false);
  });

  it("detects a real change", () => {
    expect(hasChanges(schema, { ...saved, name: "Rahul M" }, saved)).toBe(true);
  });

  it("treats an invalid edit as a change", () => {
    expect(hasChanges(schema, { ...saved, phone: "123" }, saved)).toBe(true);
  });
});
