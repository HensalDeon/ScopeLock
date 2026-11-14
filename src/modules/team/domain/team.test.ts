import { describe, expect, it } from "vitest";
import { invitationState, inviteExpiry, sameEmail } from "./invitation";
import {
  canChangeRole,
  canInviteAs,
  canRemove,
  inviteSchema,
  placesLeft,
  withAccess,
} from "./team";

const day = (n: number) => new Date(Date.UTC(2026, 10, n));
const people = [
  { userId: "m3", role: "member" as const, joinedAt: day(9) },
  { userId: "owner", role: "owner" as const, joinedAt: day(5) },
  { userId: "a1", role: "admin" as const, joinedAt: day(6) },
  { userId: "m2", role: "member" as const, joinedAt: day(7) },
];

describe("who can do what", () => {
  it("only the owner makes admins; admins invite members", () => {
    expect(canInviteAs("owner", "admin")).toBe(true);
    expect(canInviteAs("admin", "member")).toBe(true);
    expect(canInviteAs("admin", "admin")).toBe(false);
    expect(canInviteAs("member", "member")).toBe(false);
  });

  it("only the owner changes roles, never their own", () => {
    expect(canChangeRole("owner", "member")).toBe(true);
    expect(canChangeRole("owner", "owner")).toBe(false);
    expect(canChangeRole("admin", "member")).toBe(false);
  });

  it("owner removes anyone else; admins remove members only", () => {
    expect(canRemove("owner", "admin")).toBe(true);
    expect(canRemove("admin", "member")).toBe(true);
    expect(canRemove("admin", "admin")).toBe(false);
    expect(canRemove("owner", "owner")).toBe(false);
    expect(canRemove("member", "member")).toBe(false);
  });
});

describe("withAccess", () => {
  it("keeps the owner, then whoever joined first", () => {
    expect(withAccess(people, 5)).toEqual(new Set(["owner", "a1", "m2", "m3"]));
    expect(withAccess(people, 3)).toEqual(new Set(["owner", "a1", "m2"]));
    // Down to one person: only the owner.
    expect(withAccess(people, 1)).toEqual(new Set(["owner"]));
    expect(withAccess(people, 0)).toEqual(new Set(["owner"]));
  });
});

describe("placesLeft", () => {
  it("counts people and open invites against the plan", () => {
    expect(placesLeft(5, 3, 1)).toBe(1);
    expect(placesLeft(5, 4, 2)).toBe(0);
    expect(placesLeft(1, 1, 0)).toBe(0);
  });
});

describe("invitations", () => {
  const sent = day(10);
  const invite = {
    expiresAt: inviteExpiry(sent),
    acceptedAt: null,
    revokedAt: null,
  };
  it("lasts 7 days, once", () => {
    expect(invitationState(invite, day(16))).toBe("open");
    expect(invitationState(invite, day(18))).toBe("expired");
    expect(invitationState({ ...invite, acceptedAt: day(11) }, day(12))).toBe(
      "accepted",
    );
    expect(invitationState({ ...invite, revokedAt: day(11) }, day(12))).toBe(
      "revoked",
    );
  });

  it("matches the email whatever the case", () => {
    expect(sameEmail(" Rahul@Mehta.in", "rahul@mehta.in")).toBe(true);
    expect(sameEmail("rahul@mehta.in", "priya@nair.in")).toBe(false);
  });

  it("checks the invite form", () => {
    expect(
      inviteSchema.safeParse({ email: "Priya@Studio.in ", role: "member" })
        .data,
    ).toEqual({
      email: "priya@studio.in",
      role: "member",
    });
    expect(
      inviteSchema.safeParse({ email: "priya", role: "member" }).success,
    ).toBe(false);
    expect(
      inviteSchema.safeParse({ email: "p@s.in", role: "owner" }).success,
    ).toBe(false);
  });
});
