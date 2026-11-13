import { ObjectId } from "mongodb";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/shared/db/client";
import { ensureIndexes } from "@/shared/db/indexes";
import { hashToken } from "@/shared/lib/token";
import { inviteExpiry } from "../domain/invitation";
import { findInvitationByTokenHash } from "./invite-lookup";
import * as repo from "./invitations-repository";

beforeAll(async () => {
  await ensureIndexes(db());
});

const by = { userId: "u1", name: "Asha Menon" };

describe("team invitations", () => {
  it("is found by its token's hash only, and works once", async () => {
    const ws = "ws_team_once";
    const now = new Date();
    const id = await repo.insertInvitation(ws, {
      email: "priya@studio.in",
      role: "member",
      tokenHash: hashToken("token-one-aaaaaaaaaaaaaaaa"),
      invitedBy: by,
      expiresAt: inviteExpiry(now),
    });
    const found = await findInvitationByTokenHash(
      hashToken("token-one-aaaaaaaaaaaaaaaa"),
    );
    expect(found?._id.toHexString()).toBe(id);
    expect(found?.workspaceId).toBe(ws);

    const oid = new ObjectId(id);
    const [first, second] = await Promise.all([
      repo.markAccepted(ws, oid, "u2", now),
      repo.markAccepted(ws, oid, "u3", now),
    ]);
    expect([first, second].filter(Boolean)).toHaveLength(1);
    expect(await repo.findOpenInvitations(ws, now)).toHaveLength(0);
  });

  it("sending again replaces the link; cancelling closes it", async () => {
    const ws = "ws_team_renew";
    const now = new Date();
    const id = new ObjectId(
      await repo.insertInvitation(ws, {
        email: "ravi@studio.in",
        role: "admin",
        tokenHash: hashToken("old-token-bbbbbbbbbbbbbbbb"),
        invitedBy: by,
        expiresAt: inviteExpiry(now),
      }),
    );
    await repo.renewInvitation(
      ws,
      id,
      hashToken("new-token-cccccccccccccccc"),
      inviteExpiry(now),
    );
    expect(
      await findInvitationByTokenHash(hashToken("old-token-bbbbbbbbbbbbbbbb")),
    ).toBeNull();
    expect(await repo.revokeInvitation(ws, id)).toBe(true);
    expect(await repo.markAccepted(ws, id, "u9", now)).toBe(false);
    // Expired invites can't be used either.
    const late = new ObjectId(
      await repo.insertInvitation(ws, {
        email: "late@studio.in",
        role: "member",
        tokenHash: hashToken("late-token-dddddddddddddddd"),
        invitedBy: by,
        expiresAt: new Date(now.getTime() - 1000),
      }),
    );
    expect(await repo.markAccepted(ws, late, "u9", now)).toBe(false);
  });
});
