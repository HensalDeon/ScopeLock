import "server-only";
import type { ClientSession, ObjectId } from "mongodb";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection, type WorkspaceOwned } from "@/shared/db/scoped";
import type {
  ActivityActor,
  ActivityData,
  ActivityEvent,
  ActivityType,
} from "../domain/activity";

/** Insert and find only: history isn't edited. */
type ActivityDoc = WorkspaceOwned & {
  _id: ObjectId;
  projectId: ObjectId;
  type: ActivityType;
  at: Date;
  actor: ActivityActor;
  data: ActivityData;
};

const activity = (workspaceId: string) =>
  scopedCollection<ActivityDoc>(COLLECTIONS.activity, workspaceId);

export type NewActivity = {
  projectId: ObjectId;
  type: ActivityType;
  at?: Date;
  actor: ActivityActor;
  data?: ActivityData;
};

export async function insertActivity(
  workspaceId: string,
  event: NewActivity,
  session?: ClientSession,
): Promise<void> {
  await activity(workspaceId).insertOne(
    {
      projectId: event.projectId,
      type: event.type,
      at: event.at ?? new Date(),
      actor: event.actor,
      data: event.data ?? {},
    },
    { session },
  );
}

/** Newest first. */
export async function findActivity(
  workspaceId: string,
  projectId: ObjectId,
  types?: readonly ActivityType[],
): Promise<ActivityEvent[]> {
  const docs = await activity(workspaceId)
    .find(types ? { projectId, type: { $in: [...types] } } : { projectId }, {
      sort: { at: -1, _id: -1 },
      limit: 200,
    })
    .toArray();
  return docs.map((doc) => ({
    id: doc._id.toHexString(),
    projectId: doc.projectId.toHexString(),
    type: doc.type,
    at: doc.at,
    actor: doc.actor,
    data: doc.data,
  }));
}
