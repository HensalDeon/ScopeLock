import "server-only";
import type { ClientSession, ObjectId } from "mongodb";
import type { ProposalDocumentData } from "@/modules/documents";
// eslint-disable-next-line no-restricted-imports -- only for findByPortalTokenHash (reviewed public lookup)
import { collection } from "@/shared/db/collections";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection, type WorkspaceOwned } from "@/shared/db/scoped";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/shared/lib/currency";
import { minor } from "@/shared/lib/money";
import type { BillingModel, Milestone } from "../domain/billing";
import type {
  Project,
  ProjectDecision,
  ProjectStatus,
  ProjectTotals,
} from "../domain/project";
import { EMPTY_PROPOSAL, type ProposalContent } from "../domain/proposal";
import type { ScopeItem } from "../domain/scope";

type ProjectDoc = WorkspaceOwned & {
  _id: ObjectId;
  clientId: ObjectId;
  name: string;
  description: string | null;
  /** Missing on projects created before multi-currency: INR. */
  currency?: CurrencyCode;
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
  /** Client link: hash to find it, sealed copy so it can be shown again. */
  portal?: PortalLink | null;
  /** The proposal exactly as sent: what the client sees and approves. */
  sent?: SentProposal | null;
  lastDecision?:
    (Omit<ProjectDecision, "approvalId"> & { approvalId: ObjectId }) | null;
  /** Last change request number used (CR-001 = 1). */
  changeCounter?: number;
};

export type PortalLink = {
  tokenHash: string;
  tokenSealed: string;
  createdAt: Date;
};
export type SentProposal = {
  data: ProposalDocumentData;
  sentAt: Date;
  /** Who sent it, for the decision email. */
  sentBy: { userId: string; email: string };
};

/** The writable part of a project; the rest is set by the repository. */
export type ProjectData = {
  clientId: ObjectId;
  currency: CurrencyCode;
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

// Amounts come back from MongoDB as plain numbers; minor() re-checks they're
// safe integers so a corrupt document fails loudly instead of miscounting.
function toProject(doc: ProjectDoc): Project {
  return {
    id: doc._id.toHexString(),
    clientId: doc.clientId.toHexString(),
    name: doc.name,
    description: doc.description ?? null,
    currency: doc.currency ?? DEFAULT_CURRENCY,
    status: doc.status,
    billingModel: doc.billingModel,
    baseline: {
      items: doc.baseline.items.map((item) => ({
        ...item,
        description: item.description ?? null,
        includes: item.includes ?? [],
        amount: minor(item.amount),
      })),
      total: minor(doc.baseline.total),
      approvedAt: doc.baseline.approvedAt ?? null,
    },
    milestones: [...doc.milestones]
      .sort((a, b) => a.order - b.order)
      .map((m) => ({ ...m, baseAmount: minor(m.baseAmount) })),
    proposalSaved: doc.proposal !== undefined,
    sentAt: doc.sent?.sentAt ?? null,
    hasPortalLink: Boolean(doc.portal?.tokenHash),
    changeCount: doc.changeCounter ?? 0,
    lastDecision: doc.lastDecision
      ? {
          ...doc.lastDecision,
          approvalId: doc.lastDecision.approvalId.toHexString(),
        }
      : null,
    proposal: {
      ...EMPTY_PROPOSAL,
      ...doc.proposal,
      addons: (doc.proposal?.addons ?? []).map((a) => ({
        ...a,
        amount: minor(a.amount),
      })),
    },
    totals: {
      baseline: minor(doc.totals.baseline),
      approvedChanges: minor(doc.totals.approvedChanges),
      pendingChanges: minor(doc.totals.pendingChanges),
      paid: minor(doc.totals.paid),
      due: minor(doc.totals.due),
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toFields(data: ProjectData) {
  return {
    clientId: data.clientId,
    currency: data.currency,
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

// ── Sending and the client portal ──────────────────────────────────────────

/** The sealed link and the proposal as sent, for the freelancer's views. */
export async function findPortalState(
  workspaceId: string,
  id: ObjectId,
): Promise<{ portal: PortalLink | null; sent: SentProposal | null } | null> {
  const doc = await projects(workspaceId).findOne(
    { _id: id },
    { projection: { portal: 1, sent: 1 } },
  );
  return doc ? { portal: doc.portal ?? null, sent: doc.sent ?? null } : null;
}

/**
 * Draft → waiting for approval, storing the proposal exactly as sent. A new
 * link is set only when given (re-sending keeps the client's existing link).
 * Atomic: false if the project wasn't a draft.
 */
export async function markSent(
  workspaceId: string,
  id: ObjectId,
  sent: SentProposal,
  newPortal: PortalLink | null,
): Promise<boolean> {
  const { matchedCount } = await projects(workspaceId).updateOne(
    { _id: id, status: "draft" },
    {
      $set: {
        status: "awaiting_approval",
        sent,
        ...(newPortal ? { portal: newPortal } : {}),
      },
    },
  );
  return matchedCount === 1;
}

/** Waiting → draft, so the freelancer can edit. The link stays the same. */
export async function markWithdrawn(
  workspaceId: string,
  id: ObjectId,
): Promise<boolean> {
  const { matchedCount } = await projects(workspaceId).updateOne(
    { _id: id, status: "awaiting_approval" },
    { $set: { status: "draft" } },
  );
  return matchedCount === 1;
}

/** Replaces the client link; the old one stops working at once. */
export async function replacePortal(
  workspaceId: string,
  id: ObjectId,
  portal: PortalLink,
): Promise<boolean> {
  const { matchedCount } = await projects(workspaceId).updateOne(
    { _id: id },
    { $set: { portal } },
  );
  return matchedCount === 1;
}

export type PortalProject = {
  workspaceId: string;
  project: Project;
  sent: SentProposal | null;
};

/**
 * PUBLIC LOOKUP (reviewed): the client portal has no signed-in workspace, so
 * this is the one query that isn't workspace-scoped. It matches only on the
 * hash of a 256-bit token from the URL; the result carries its own
 * workspaceId, and every write that follows is scoped to it.
 */
export async function findByPortalTokenHash(
  tokenHash: string,
): Promise<PortalProject | null> {
  const doc = await collection<ProjectDoc>(COLLECTIONS.projects).findOne({
    "portal.tokenHash": tokenHash,
  });
  if (!doc) return null;
  return {
    workspaceId: doc.workspaceId,
    project: toProject(doc),
    sent: doc.sent ?? null,
  };
}

/**
 * Records the client's answer on the project, inside the caller's
 * transaction. Atomic and guarded: only while still waiting for approval and
 * only for the current link and the version the client saw, so a withdrawn
 * or re-sent proposal, a replaced link or a second tap can't change
 * anything. Approved → active (baseline locked); changes requested → draft.
 */
export async function applyDecision(
  input: {
    workspaceId: string;
    projectId: ObjectId;
    tokenHash: string;
    /** When the version the client decided on was sent. */
    sentAt: Date;
    decision: ProjectDecision["decision"];
    approvalId: ObjectId;
    at: Date;
    name: string;
    email: string;
    comment: string | null;
  },
  session: ClientSession,
): Promise<boolean> {
  const lastDecision = {
    decision: input.decision,
    at: input.at,
    name: input.name,
    email: input.email,
    comment: input.comment,
    approvalId: input.approvalId,
  };
  const updated = await projects(input.workspaceId).findOneAndUpdate(
    {
      _id: input.projectId,
      status: "awaiting_approval",
      "portal.tokenHash": input.tokenHash,
      "sent.sentAt": input.sentAt,
    },
    {
      $set:
        input.decision === "approved"
          ? {
              status: "active",
              "baseline.approvedAt": input.at,
              "baseline.approvalId": input.approvalId,
              lastDecision,
            }
          : { status: "draft", lastDecision },
    },
    { session },
  );
  return updated !== null;
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
