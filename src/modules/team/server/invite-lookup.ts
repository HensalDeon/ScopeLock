import "server-only";
// eslint-disable-next-line no-restricted-imports -- only for findInvitationByTokenHash (reviewed public lookup)
import { collection } from "@/shared/db/collections";
import { COLLECTIONS } from "@/shared/db/names";
import type { InvitationDoc } from "./invitations-repository";

/**
 * The invite link's one lookup that isn't workspace-scoped: by the hash of
 * its token (the workspace comes from the invite found). The raw token is
 * never stored.
 */
export async function findInvitationByTokenHash(
  tokenHash: string,
): Promise<InvitationDoc | null> {
  return collection<InvitationDoc>(COLLECTIONS.teamInvitations).findOne({
    tokenHash,
  });
}
