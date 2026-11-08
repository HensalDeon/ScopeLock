import "server-only";
import type { ClientSession, ObjectId } from "mongodb";
import { DEFAULT_CURRENCY } from "@/shared/lib/currency";
import { minor } from "@/shared/lib/money";
import type { Project } from "../domain/project";

import {
  projects,
  toFields,
  toProject,
  type ProjectData,
} from "./project-docs";

export type { PortalLink, ProjectData, SentProposal } from "./project-docs";

/** Newest activity first, one page at a time. */
export async function findProjects(
  workspaceId: string,
  filter: { clientId?: ObjectId } = {},
  window: { skip: number; limit: number } = { skip: 0, limit: 100 },
): Promise<Project[]> {
  const docs = await projects(workspaceId)
    .find(filter.clientId ? { clientId: filter.clientId } : {}, {
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
> & { baselineTotal: Project["baseline"]["total"] };

export async function findProjectSummaries(
  workspaceId: string,
): Promise<ProjectSummary[]> {
  const docs = await projects(workspaceId)
    .find(
      { status: { $ne: "archived" } },
      {
        projection: {
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
  filter: { clientId?: ObjectId } = {},
): Promise<number> {
  return projects(workspaceId).countDocuments(
    filter.clientId ? { clientId: filter.clientId } : {},
  );
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
