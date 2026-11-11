import "server-only";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection, type WorkspaceOwned } from "@/shared/db/scoped";
import type { ClientSession, ObjectId } from "mongodb";
import { DEFAULT_CURRENCY } from "@/shared/lib/currency";
import { minor } from "@/shared/lib/money";
import { containsPattern } from "@/shared/lib/search";
import type { Project } from "../domain/project";

import {
  projects,
  toFields,
  toProject,
  type ProjectData,
} from "./project-docs";

export type { PortalLink, ProjectData, SentProposal } from "./project-docs";

type ProjectFilter = {
  clientId?: ObjectId;
  /** Archived projects only (default: the active ones). */
  archived?: boolean;
  /** Project name contains it, or the project is for one of `clientIds`. */
  search?: { text: string; clientIds: ObjectId[] } | null;
};

function projectQuery({ clientId, archived, search }: ProjectFilter) {
  const base = {
    ...(clientId ? { clientId } : {}),
    // A client's page lists all their projects; the projects list splits.
    ...(archived === undefined
      ? {}
      : { archivedAt: archived ? { $ne: null } : null }),
  };
  if (!search) return base;
  return {
    ...base,
    $or: [
      { name: containsPattern(search.text) },
      ...(search.clientIds.length
        ? [{ clientId: { $in: search.clientIds } }]
        : []),
    ],
  };
}

/** Newest activity first, one page at a time. */
export async function findProjects(
  workspaceId: string,
  filter: ProjectFilter = {},
  window: { skip: number; limit: number } = { skip: 0, limit: 100 },
): Promise<Project[]> {
  const docs = await projects(workspaceId)
    .find(projectQuery(filter), {
      sort: { updatedAt: -1, _id: -1 },
      skip: window.skip,
      limit: window.limit,
    })
    .toArray();
  return docs.map(toProject);
}

/**
 * A light row per project for workspace-wide figures (the overview): no
 * scope lines, proposal text or sent copies.
 */
export type ProjectSummary = Pick<
  Project,
  | "id"
  | "name"
  | "status"
  | "currency"
  | "clientId"
  | "totals"
  | "sentAt"
  | "lastDecision"
  | "updatedAt"
  | "changeCount"
> & {
  baselineTotal: Project["baseline"]["total"];
  /** Archived: still in the money totals, never asked to act on. */
  archived: boolean;
};

export async function findProjectSummaries(
  workspaceId: string,
): Promise<ProjectSummary[]> {
  const docs = await projects(workspaceId)
    .find(
      // Archived projects keep their money in the totals (archiving only
      // frees a place on the plan); an archived draft has no money to show.
      { $or: [{ archivedAt: null }, { status: { $ne: "draft" } }] },
      {
        projection: {
          archivedAt: 1,
          name: 1,
          status: 1,
          currency: 1,
          clientId: 1,
          totals: 1,
          "baseline.total": 1,
          "sent.sentAt": 1,
          lastDecision: 1,
          updatedAt: 1,
          changeCounter: 1,
        },
        sort: { updatedAt: -1 },
        limit: 1000,
      },
    )
    .toArray();
  return docs.map((doc) => ({
    id: doc._id.toHexString(),
    name: doc.name,
    status: doc.status,
    currency: doc.currency ?? DEFAULT_CURRENCY,
    clientId: doc.clientId.toHexString(),
    baselineTotal: minor(doc.baseline.total),
    archived: Boolean(doc.archivedAt),
    totals: {
      baseline: minor(doc.totals.baseline),
      approvedChanges: minor(doc.totals.approvedChanges),
      pendingChanges: minor(doc.totals.pendingChanges),
      paid: minor(doc.totals.paid),
      due: minor(doc.totals.due),
    },
    sentAt: doc.sent?.sentAt ?? null,
    lastDecision: doc.lastDecision
      ? {
          ...doc.lastDecision,
          approvalId: doc.lastDecision.approvalId.toHexString(),
        }
      : null,
    updatedAt: doc.updatedAt,
    changeCount: doc.changeCounter ?? 0,
  }));
}

export async function findProject(
  workspaceId: string,
  id: ObjectId,
): Promise<Project | null> {
  const doc = await projects(workspaceId).findOne({ _id: id });
  return doc ? toProject(doc) : null;
}

export async function countProjects(
  workspaceId: string,
  filter: ProjectFilter = {},
): Promise<number> {
  return projects(workspaceId).countDocuments(projectQuery(filter));
}

/** Projects that count towards the plan's limit: anything not archived. */
export async function countActiveProjects(
  workspaceId: string,
): Promise<number> {
  return projects(workspaceId).countDocuments({ archivedAt: null });
}

/** How many projects each client has (for the clients list). */
export async function countProjectsByClient(
  workspaceId: string,
): Promise<Map<string, number>> {
  const rows = (await projects(workspaceId)
    .aggregate([{ $group: { _id: "$clientId", count: { $sum: 1 } } }])
    .toArray()) as { _id: ObjectId; count: number }[];
  return new Map(rows.map((r) => [r._id.toHexString(), r.count]));
}

export async function insertProject(
  workspaceId: string,
  data: ProjectData,
): Promise<string> {
  const { insertedId } = await projects(workspaceId).insertOne({
    number: await nextProposalNumber(workspaceId),
    clientId: data.clientId,
    name: data.name,
    description: data.description,
    currency: data.currency,
    status: "draft",
    billingModel: data.billingModel,
    baseline: {
      items: data.items,
      total: data.total,
      approvedAt: null,
      approvalId: null,
    },
    milestones: data.milestones,
    proposal: data.proposal,
    totals: data.totals,
  });
  return insertedId.toHexString();
}

/**
 * Updates a project only while it's still a draft (atomic: the status check
 * and the write happen together). Returns false otherwise.
 */
export async function updateDraftProject(
  workspaceId: string,
  id: ObjectId,
  data: ProjectData,
): Promise<boolean> {
  const { matchedCount } = await projects(workspaceId).updateOne(
    { _id: id, status: "draft" },
    { $set: toFields(data) },
  );
  return matchedCount === 1;
}

/** Deletes a project only while it's still a draft. */
export async function deleteDraftProject(
  workspaceId: string,
  id: ObjectId,
): Promise<boolean> {
  const { deletedCount } = await projects(workspaceId).deleteOne({
    _id: id,
    status: "draft",
  });
  return deletedCount === 1;
}

// ── Change requests (used by the changes module) ───────────────────────────

/**
 * The next CR number for an approved project (1, 2, 3…), from an atomic
 * counter on the project, so two people can't get the same number. Null if
 * the project isn't active.
 */
export async function nextChangeNumber(
  workspaceId: string,
  id: ObjectId,
): Promise<number | null> {
  const doc = await projects(workspaceId).findOneAndUpdate(
    { _id: id, status: "active" },
    { $inc: { changeCounter: 1 } },
    { returnDocument: "after", projection: { changeCounter: 1 } },
  );
  return doc?.changeCounter ?? null;
}

/** Keeps the project's denormalised change totals in step. */
export async function setChangeTotals(
  workspaceId: string,
  id: ObjectId,
  totals: { approved: number; pending: number },
  session?: ClientSession,
): Promise<void> {
  await projects(workspaceId).updateOne(
    { _id: id },
    {
      $set: {
        "totals.approvedChanges": totals.approved,
        "totals.pendingChanges": totals.pending,
      },
    },
    { session },
  );
}

/**
 * Holds the project as not archived for a write that's about to ask the
 * client for something (a payment, a change request). Inside a transaction
 * it also blocks an archive racing it. False if it's archived (or gone).
 */
export async function claimActiveProject(
  workspaceId: string,
  id: ObjectId,
  session?: ClientSession,
): Promise<boolean> {
  const r = await projects(workspaceId).updateOne(
    { _id: id, archivedAt: null },
    { $set: { archivedAt: null } },
    { session },
  );
  return r.matchedCount === 1;
}

/** Not archived, and nothing waits on the client (as archiveBlocker). */
const ARCHIVABLE = {
  archivedAt: null,
  status: { $ne: "awaiting_approval" as const },
  "totals.pendingChanges": 0,
  "totals.due": 0,
};

/** Projects that could be archived right now, least recently touched first. */
export async function findArchivable(
  workspaceId: string,
  limit = 5,
): Promise<{ id: string; name: string }[]> {
  const docs = await projects(workspaceId)
    .find(ARCHIVABLE, {
      projection: { name: 1 },
      sort: { updatedAt: 1 },
      limit,
    })
    .toArray();
  return docs.map((d) => ({ id: d._id.toHexString(), name: d.name }));
}

/**
 * Archive or restore. Archiving only matches while nothing waits on the
 * client (checked again here, so a proposal or request sent meanwhile wins).
 * Returns false if the project is gone or no longer qualifies.
 */
export async function setProjectArchived(
  workspaceId: string,
  id: ObjectId,
  archived: boolean,
): Promise<boolean> {
  const result = await projects(workspaceId).updateOne(
    archived
      ? { _id: id, ...ARCHIVABLE }
      : { _id: id, archivedAt: { $ne: null } },
    { $set: { archivedAt: archived ? new Date() : null } },
  );
  return result.matchedCount === 1;
}

/** Keeps the project's received / owed totals in step with its payments. */
export async function setPaymentTotals(
  workspaceId: string,
  id: ObjectId,
  totals: { paid: number; due: number },
  session?: ClientSession,
): Promise<void> {
  await projects(workspaceId).updateOne(
    { _id: id },
    { $set: { "totals.paid": totals.paid, "totals.due": totals.due } },
    { session },
  );
}

const counters = (workspaceId: string) =>
  scopedCollection<WorkspaceOwned & { name: string; seq: number }>(
    COLLECTIONS.counters,
    workspaceId,
  );

/** The workspace's next proposal number (1, 2, 3…), atomically. */
async function nextProposalNumber(workspaceId: string): Promise<number> {
  const doc = await counters(workspaceId).findOneAndUpdate(
    { name: "proposal" },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  return doc?.seq ?? 1;
}
