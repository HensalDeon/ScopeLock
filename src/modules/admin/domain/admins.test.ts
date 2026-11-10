import { describe, expect, it } from "vitest";
import { isAdmin, parseAdminEmails } from "./admins";

describe("parseAdminEmails", () => {
  it("reads a comma list, trimmed and lower-cased", () => {
    expect(parseAdminEmails(" Asha@Studio.in, ravi@x.co ,, nope ")).toEqual([
      "asha@studio.in",
      "ravi@x.co",
    ]);
  });
  it("is nobody when unset", () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
  });
});

describe("isAdmin", () => {
  const admins = ["asha@studio.in"];
  it("needs a listed, confirmed email", () => {
    expect(
      isAdmin({ email: "ASHA@studio.in", emailVerified: true }, admins),
    ).toBe(true);
    expect(
      isAdmin({ email: "asha@studio.in", emailVerified: false }, admins),
    ).toBe(false);
    expect(isAdmin({ email: "ravi@x.co", emailVerified: true }, admins)).toBe(
      false,
    );
    expect(isAdmin(null, admins)).toBe(false);
  });
});
