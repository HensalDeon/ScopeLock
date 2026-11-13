import "server-only";
import type { ObjectId } from "mongodb";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection, type WorkspaceOwned } from "@/shared/db/scoped";
import type { InviteRole } from "../domain/team";

/** Team invitations. The link's token is never stored, only its hash. */
export type InvitationDoc = WorkspaceOwned & {
  _id: ObjectId;
  /** Lowercased. */
  email: string;
  role: InviteRole;
  tokenHash: string;
  invitedBy: { userId: string; name: string };
  expiresAt: Date;
  acceptedAt: Date | null;
  acceptedBy?: string;
  revokedAt: Date | null;
};

const invitations = (workspaceId: string) =>
  scopedCollection<InvitationDoc>(COLLECTIONS.teamInvitations, workspaceId);

export async function insertInvitation(
  workspaceId: string,
  invite: Pick<
    InvitationDoc,
    "email" | "role" | "tokenHash" | "invitedBy" | "expiresAt"
  >,
): Promise<string> {
  const { insertedId } = await invitations(workspaceId).insertOne({
    ...invite,
    acceptedAt: null,
    revokedAt: null,
  });
  return insertedId.toHexString();
}

/** Invites still waiting to be accepted, newest first. */
export async function findOpenInvitations(
  workspaceId: string,
  now: Date,
): Promise<InvitationDoc[]> {
  return invitations(workspaceId)
    .find(
      { acceptedAt: null, revokedAt: null, expiresAt: { $gt: now } },
      { sort: { createdAt: -1 }, limit: 50 },
    )
    .toArray();
}

/** Invites that ran out in the last 30 days, unused: shown to send again. */
export async function findExpiredInvitations(
  workspaceId: string,
  now: Date,
): Promise<InvitationDoc[]> {
  return invitations(workspaceId)
    .find(
      {
        acceptedAt: null,
        revokedAt: null,
        expiresAt: {
          $lte: now,
          $gt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      { sort: { expiresAt: -1 }, limit: 20 },
    )
    .toArray();
}

export async function findInvitation(
  workspaceId: string,
  id: ObjectId,
): Promise<InvitationDoc | null> {
  return invitations(workspaceId).findOne({ _id: id });
}

/** Cancels an invite that hasn't been accepted. */
export async function revokeInvitation(
  workspaceId: string,
  id: ObjectId,
): Promise<boolean> {
  const { modifiedCount } = await invitations(workspaceId).updateOne(
    { _id: id, acceptedAt: null, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
  return modifiedCount === 1;
}

/** Sends it again: a new link (the old one stops working) and 7 more days. */
export async function renewInvitation(
  workspaceId: string,
  id: ObjectId,
  tokenHash: string,
  expiresAt: Date,
): Promise<boolean> {
  const { modifiedCount } = await invitations(workspaceId).updateOne(
    { _id: id, acceptedAt: null, revokedAt: null },
    { $set: { tokenHash, expiresAt } },
  );
  return modifiedCount === 1;
}

/** Uses the invite. Atomic: false if it was used, cancelled or expired. */
export async function markAccepted(
  workspaceId: string,
  id: ObjectId,
  userId: string,
  now: Date,
): Promise<boolean> {
  const { modifiedCount } = await invitations(workspaceId).updateOne(
    { _id: id, acceptedAt: null, revokedAt: null, expiresAt: { $gt: now } },
    { $set: { acceptedAt: now, acceptedBy: userId } },
  );
  return modifiedCount === 1;
}
