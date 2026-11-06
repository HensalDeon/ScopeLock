import "server-only";
import type { ClientSession, ObjectId } from "mongodb";
import { requireWorkspace } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import {
  PAGE_SIZE,
  paginate,
  toPage,
  type Page,
} from "@/shared/lib/pagination";
import {
  ACTIVITY_TYPES,
  describeActivity,
  isClientVisible,
  type ActivityLine,
  type Viewer,
} from "../domain/activity";
import {
  countActivity,
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

/**
 * One page of a project's history for the signed-in member, newest first.
 * The project page asks for a short first page; the full history page
 * pages through the rest.
 */
export async function listProjectActivity(
  projectId: string,
  { page = 1, pageSize = PAGE_SIZE }: { page?: number; pageSize?: number } = {},
): Promise<Page<ActivityItem>> {
  const id = parseObjectId(projectId);
  if (!id) return toPage([], 0, 1, pageSize);
  const { workspace, user } = await requireWorkspace();
  const ws = workspace.workspaceId;
  const viewer: Viewer = { kind: "member", userId: user.id };
  const result = await paginate(
    page,
    () => countActivity(ws, id),
    (window) => findActivity(ws, id, undefined, window),
    pageSize,
  );
  return {
    ...result,
    items: result.items.map((e) => ({
      id: e.id,
      at: e.at,
      ...describeActivity(e, viewer),
    })),
  };
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
  // The latest 50: the portal shows a few and folds the rest.
  const events = await findActivity(
    workspaceId,
    projectId,
    ACTIVITY_TYPES.filter(isClientVisible),
    { skip: 0, limit: 50 },
  );
  return events.map((e) => ({
    id: e.id,
    at: e.at,
    ...describeActivity(e, viewer),
  }));
}

/**
 * The workspace's latest events, each with its project id (for the
 * overview). Drafting a change is left out: unsent drafts already show under
 * "Needs you", and the project page keeps the full history.
 */
export async function listRecentActivity(
  limit = 10,
): Promise<(ActivityItem & { projectId: string })[]> {
  const { workspace, user } = await requireWorkspace();
  const viewer: Viewer = { kind: "member", userId: user.id };
  const events = await findRecentActivity(workspace.workspaceId, limit, [
    "change.created",
  ]);
  return events.map((e) => ({
    id: e.id,
    at: e.at,
    projectId: e.projectId,
    ...describeActivity(e, viewer),
  }));
}
