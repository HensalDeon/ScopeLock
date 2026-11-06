import "server-only";
import type { ClientSession, ObjectId } from "mongodb";
import { requireWorkspace } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import {
  ACTIVITY_TYPES,
  describeActivity,
  isClientVisible,
  type ActivityLine,
  type Viewer,
} from "../domain/activity";
import {
  findActivity,
  findRecentActivity,
  insertActivity,
  type NewActivity,
} from "./repository";

/**
 * Records an event after the change it describes has been saved. A failure
 * is logged, never shown: the change itself already happened.
 */
export async function logActivity(
  workspaceId: string,
  event: NewActivity,
): Promise<void> {
  try {
    await insertActivity(workspaceId, event);
  } catch (error) {
    console.error("[activity] not recorded", event.type, error);
  }
}

/** Same, inside a transaction: commits (or not) with the change. */
export async function logActivityInTransaction(
  workspaceId: string,
  event: NewActivity,
  session: ClientSession,
): Promise<void> {
  await insertActivity(workspaceId, event, session);
}

export type ActivityItem = { id: string; at: Date } & ActivityLine;

/** The project's full history for the signed-in member, newest first. */
export async function listProjectActivity(
  projectId: string,
): Promise<ActivityItem[]> {
  const id = parseObjectId(projectId);
  if (!id) return [];
  const { workspace, user } = await requireWorkspace();
  const viewer: Viewer = { kind: "member", userId: user.id };
  const events = await findActivity(workspace.workspaceId, id);
  return events.map((e) => ({
    id: e.id,
    at: e.at,
    ...describeActivity(e, viewer),
  }));
}

/**
 * For the public portal only (the workspace comes from the link's lookup):
 * what the client may see, in the client's words.
 */
export async function listClientHistory(
  workspaceId: string,
  projectId: ObjectId,
  businessName: string,
): Promise<ActivityItem[]> {
  const viewer: Viewer = { kind: "client", businessName };
  const events = await findActivity(
    workspaceId,
    projectId,
    ACTIVITY_TYPES.filter(isClientVisible),
  );
  return events.map((e) => ({
    id: e.id,
    at: e.at,
    ...describeActivity(e, viewer),
  }));
}

/** The workspace's latest events, each with its project id (for the overview). */
export async function listRecentActivity(
  limit = 10,
): Promise<(ActivityItem & { projectId: string })[]> {
  const { workspace, user } = await requireWorkspace();
  const viewer: Viewer = { kind: "member", userId: user.id };
  const events = await findRecentActivity(workspace.workspaceId, limit);
  return events.map((e) => ({
    id: e.id,
    at: e.at,
    projectId: e.projectId,
    ...describeActivity(e, viewer),
  }));
}
