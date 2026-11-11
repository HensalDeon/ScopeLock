import { describe, expect, it } from "vitest";
import { isAdmin, isListedAdmin, parseAdminEmails } from "./admins";

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

describe("isListedAdmin", () => {
  it("matches a listed email whether or not it's confirmed yet", () => {
    const admins = parseAdminEmails("admin@scopelock.test");
    expect(isListedAdmin(" Admin@ScopeLock.test", admins)).toBe(true);
    expect(isListedAdmin("someone@else.test", admins)).toBe(false);
    expect(isListedAdmin(null, admins)).toBe(false);
  });
});
