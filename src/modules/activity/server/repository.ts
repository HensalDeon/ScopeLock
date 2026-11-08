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

const projectFilter = (projectId: ObjectId, types?: readonly ActivityType[]) =>
  types ? { projectId, type: { $in: [...types] } } : { projectId };

/** Newest first, one window at a time. */
export async function findActivity(
  workspaceId: string,
  projectId: ObjectId,
  types?: readonly ActivityType[],
  window: { skip: number; limit: number } = { skip: 0, limit: 50 },
): Promise<ActivityEvent[]> {
  const docs = await activity(workspaceId)
    .find(projectFilter(projectId, types), {
      sort: { at: -1, _id: -1 },
      skip: window.skip,
      limit: window.limit,
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

export async function countActivity(
  workspaceId: string,
  projectId: ObjectId,
  types?: readonly ActivityType[],
): Promise<number> {
  return activity(workspaceId).countDocuments(projectFilter(projectId, types));
}

/** The latest events across every project in the workspace. */
export async function findRecentActivity(
  workspaceId: string,
  limit: number,
  exclude: readonly ActivityType[] = [],
): Promise<ActivityEvent[]> {
  const docs = await activity(workspaceId)
    .find(exclude.length ? { type: { $nin: [...exclude] } } : {}, {
      sort: { at: -1, _id: -1 },
      limit,
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
