import "server-only";
import type { ObjectId } from "mongodb";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection, type WorkspaceOwned } from "@/shared/db/scoped";
import { paise } from "@/shared/lib/money";
import type { BillingModel, Milestone } from "../domain/billing";
import type { Project, ProjectStatus, ProjectTotals } from "../domain/project";
import { EMPTY_PROPOSAL, type ProposalContent } from "../domain/proposal";
import type { ScopeItem } from "../domain/scope";

type ProjectDoc = WorkspaceOwned & {
  _id: ObjectId;
  clientId: ObjectId;
  name: string;
  description: string | null;
  currency: "INR";
  status: ProjectStatus;
  billingModel: BillingModel;
  baseline: {
    items: ScopeItem[];
    total: number;
    approvedAt: Date | null;
    approvalId: ObjectId | null;
  };
  milestones: Milestone[];
  /** Missing on projects created before Phase 3A. */
  proposal?: ProposalContent;
  totals: ProjectTotals;
};

/** The writable part of a project; the rest is set by the repository. */
export type ProjectData = {
  clientId: ObjectId;
  name: string;
  description: string | null;
  billingModel: BillingModel;
  items: ScopeItem[];
  total: number;
  milestones: Milestone[];
  proposal: ProposalContent;
  totals: ProjectTotals;
};

const projects = (workspaceId: string) =>
  scopedCollection<ProjectDoc>(COLLECTIONS.projects, workspaceId);

// Amounts come back from MongoDB as plain numbers; paise() re-checks they're
// safe integers so a corrupt document fails loudly instead of miscounting.
function toProject(doc: ProjectDoc): Project {
  return {
    id: doc._id.toHexString(),
    clientId: doc.clientId.toHexString(),
    name: doc.name,
    description: doc.description ?? null,
    currency: doc.currency,
    status: doc.status,
    billingModel: doc.billingModel,
    baseline: {
      items: doc.baseline.items.map((item) => ({
        ...item,
        description: item.description ?? null,
        includes: item.includes ?? [],
        amount: paise(item.amount),
      })),
      total: paise(doc.baseline.total),
      approvedAt: doc.baseline.approvedAt ?? null,
    },
    milestones: [...doc.milestones]
      .sort((a, b) => a.order - b.order)
      .map((m) => ({ ...m, baseAmount: paise(m.baseAmount) })),
    proposal: {
      ...EMPTY_PROPOSAL,
      ...doc.proposal,
      addons: (doc.proposal?.addons ?? []).map((a) => ({
        ...a,
        amount: paise(a.amount),
      })),
    },
    totals: {
      baseline: paise(doc.totals.baseline),
      approvedChanges: paise(doc.totals.approvedChanges),
      pendingChanges: paise(doc.totals.pendingChanges),
      paid: paise(doc.totals.paid),
      due: paise(doc.totals.due),
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toFields(data: ProjectData) {
  return {
    clientId: data.clientId,
    name: data.name,
    description: data.description,
    billingModel: data.billingModel,
    "baseline.items": data.items,
    "baseline.total": data.total,
    milestones: data.milestones,
    proposal: data.proposal,
    totals: data.totals,
  };
}

export async function findProjects(
  workspaceId: string,
  filter: { clientId?: ObjectId } = {},
): Promise<Project[]> {
  const docs = await projects(workspaceId)
    .find(filter.clientId ? { clientId: filter.clientId } : {}, {
      sort: { updatedAt: -1 },
    })
    .toArray();
  return docs.map(toProject);
}

export async function findProject(
  workspaceId: string,
  id: ObjectId,
): Promise<Project | null> {
  const doc = await projects(workspaceId).findOne({ _id: id });
  return doc ? toProject(doc) : null;
}

export async function countProjects(workspaceId: string): Promise<number> {
  return projects(workspaceId).countDocuments();
}

export async function insertProject(
  workspaceId: string,
  data: ProjectData,
): Promise<string> {
  const { insertedId } = await projects(workspaceId).insertOne({
    clientId: data.clientId,
    name: data.name,
    description: data.description,
    currency: "INR",
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
