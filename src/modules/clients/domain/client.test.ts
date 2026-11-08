import { describe, expect, it } from "vitest";
import {
  clientFirstName,
  clientInputSchema,
  clientLabel,
  normalizeBilling,
} from "./client";

describe("clientInputSchema", () => {
  it("cleans up a full entry", () => {
    expect(
      clientInputSchema.parse({
        name: "  Rahul Mehta ",
        company: " Mehta Interiors ",
        email: " Rahul@MehtaInteriors.in ",
        phone: "98765 43210",
      }),
    ).toEqual({
      name: "Rahul Mehta",
      company: "Mehta Interiors",
      email: "rahul@mehtainteriors.in",
      phone: "+919876543210",
      currency: null,
      address: null,
      state: null,
      country: null,
      gstin: null,
    });
  });

  it("only needs a name", () => {
    expect(
      clientInputSchema.parse({
        name: "Asha",
        company: "",
        email: "",
        phone: "",
      }),
    ).toEqual({
      name: "Asha",
      company: null,
      email: null,
      phone: null,
      currency: null,
      address: null,
      state: null,
      country: null,
      gstin: null,
    });
  });

  it("explains what's wrong, per field", () => {
    const result = clientInputSchema.safeParse({
      name: "R",
      company: "",
      email: "rahul@",
      phone: "12345",
    });
    expect(result.success).toBe(false);
    const messages = Object.fromEntries(
      result.error!.issues.map((i) => [i.path[0], i.message]),
    );
    expect(messages).toEqual({
      name: "Enter the client's name.",
      email: "Enter a valid email address, or leave it empty.",
      phone: "Enter a 10-digit mobile number, or include the country code.",
    });
  });
});

describe("client labels", () => {
  it("joins name and company", () => {
    expect(
      clientLabel({ name: "Rahul Mehta", company: "Mehta Interiors" }),
    ).toBe("Rahul Mehta · Mehta Interiors");
    expect(clientLabel({ name: "Asha Rao", company: null })).toBe("Asha Rao");
    expect(clientFirstName({ name: "Rahul Mehta" })).toBe("Rahul");
  });
});

describe("client currency", () => {
  it("is optional: empty means the workspace default", () => {
    const base = { name: "John Carter", company: "", email: "", phone: "" };
    expect(
      clientInputSchema.parse({ ...base, currency: "" }).currency,
    ).toBeNull();
    expect(clientInputSchema.parse({ ...base, currency: "USD" }).currency).toBe(
      "USD",
    );
    expect(
      clientInputSchema.safeParse({ ...base, currency: "BTC" }).success,
    ).toBe(false);
  });
});

describe("billing details", () => {
  const base = { name: "Rahul Mehta", company: "", email: "", phone: "" };

  it("are optional, and India is the default country", () => {
    const parsed = clientInputSchema.parse({ ...base, country: "India" });
    expect(parsed).toMatchObject({
      address: null,
      state: null,
      country: null,
      gstin: null,
    });
  });

  it("checks the GSTIN and takes the state from it", () => {
    expect(
      clientInputSchema.safeParse({ ...base, gstin: "27ABCDE1234F1Z" }).success,
    ).toBe(false);
    const parsed = clientInputSchema.parse({
      ...base,
      gstin: "27abcde1234f1z5",
      state: "32",
    });
    expect(parsed.gstin).toBe("27ABCDE1234F1Z5");
    expect(normalizeBilling(parsed).state).toBe("27");
  });

  it("a client abroad has no Indian state or GSTIN", () => {
    const parsed = clientInputSchema.parse({
      ...base,
      country: "Canada",
      state: "27",
    });
    expect(normalizeBilling(parsed)).toMatchObject({
      country: "Canada",
      state: null,
      gstin: null,
    });
  });
});
