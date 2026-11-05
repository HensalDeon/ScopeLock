import { describe, expect, it } from "vitest";
import { clientFirstName, clientInputSchema, clientLabel } from "./client";

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
    ).toEqual({ name: "Asha", company: null, email: null, phone: null });
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
