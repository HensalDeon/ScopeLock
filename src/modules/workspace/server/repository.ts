import "server-only";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection } from "@/shared/db/scoped";
import type { WorkspaceDetails, WorkspaceProfile } from "../domain/workspace";

type WorkspaceProfileDoc = WorkspaceProfile;

const profiles = (workspaceId: string) =>
  scopedCollection<WorkspaceProfileDoc>(
    COLLECTIONS.workspaceProfiles,
    workspaceId,
  );

function toWorkspaceProfile(doc: WorkspaceProfileDoc): WorkspaceProfile {
  return {
    workspaceId: doc.workspaceId,
    businessName: doc.businessName,
    businessType: doc.businessType,
    phone: doc.phone ?? null,
    currency: doc.currency ?? "INR",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function getWorkspaceProfile(
  workspaceId: string,
): Promise<WorkspaceProfile | null> {
  const doc = await profiles(workspaceId).findOne();
  return doc ? toWorkspaceProfile(doc) : null;
}

/** Creates the profile, or updates it if it already exists (safe to retry). */
export async function saveWorkspaceProfile(
  workspaceId: string,
  details: WorkspaceDetails,
): Promise<void> {
  await profiles(workspaceId).updateOne(
    {},
    {
      $set: {
        businessName: details.businessName,
        businessType: details.businessType,
        phone: details.phone,
        currency: details.currency,
      },
    },
    { upsert: true },
  );
}
