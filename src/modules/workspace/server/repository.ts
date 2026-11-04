import "server-only";
import { collection, COLLECTIONS } from "@/shared/db/collections";
import type { WorkspaceDetails, WorkspaceProfile } from "../domain/workspace";

const profiles = () =>
  collection<WorkspaceProfile>(COLLECTIONS.workspaceProfiles);

export async function getWorkspaceProfile(
  workspaceId: string,
): Promise<WorkspaceProfile | null> {
  return profiles().findOne(
    { workspaceId },
    { projection: { _id: 0 } },
  ) as Promise<WorkspaceProfile | null>;
}

/** Creates the profile, or updates it if it already exists (safe to retry). */
export async function saveWorkspaceProfile(
  workspaceId: string,
  details: WorkspaceDetails,
): Promise<void> {
  const now = new Date();
  await profiles().updateOne(
    { workspaceId },
    {
      $set: {
        businessName: details.businessName,
        businessType: details.businessType,
        phone: details.phone,
        updatedAt: now,
      },
      $setOnInsert: { workspaceId, currency: "INR", createdAt: now },
    },
    { upsert: true },
  );
}
