import "server-only";
import type { ObjectId } from "mongodb";
import type { ProposalDocumentData } from "@/modules/documents";
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

/** How a project is stored, and how it maps to the domain type. */

export type ProjectDoc = WorkspaceOwned & {
  _id: ObjectId;
  /** Missing before proposal numbering. */
  number?: number;
  /** Set while archived (read-only, not counted towards the plan). */
  archivedAt?: Date | null;
  /** Payments asked for or received (milestone ids): nothing joins them. */
  closedPaymentKeys?: string[];
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

export const projects = (workspaceId: string) =>
  scopedCollection<ProjectDoc>(COLLECTIONS.projects, workspaceId);

// Amounts come back from MongoDB as plain numbers; minor() re-checks they're
// safe integers so a corrupt document fails loudly instead of miscounting.
export function toProject(doc: ProjectDoc): Project {
  return {
    id: doc._id.toHexString(),
    number: doc.number ?? null,
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
    archivedAt: doc.archivedAt ?? null,
    closedPaymentKeys: doc.closedPaymentKeys ?? [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toFields(data: ProjectData) {
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
