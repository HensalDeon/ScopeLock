import { type CurrencyCode } from "@/shared/lib/currency";
import { minor, type Minor } from "@/shared/lib/money";
import { type BillingModel, type Milestone } from "./billing";
import { type ProposalContent } from "./proposal";
import { type ScopeItem } from "./scope";

export const PROJECT_STATUSES = [
  "draft",
  "awaiting_approval",
  "active",
  "completed",
  "archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
  awaiting_approval: "Waiting for approval",
  active: "Scope approved",
  completed: "Completed",
  archived: "Archived",
};

/** The client has approved the baseline (change requests can follow). */
export function isScopeApproved(status: ProjectStatus): boolean {
  return status === "active" || status === "completed";
}

/** The WhatsApp text that goes before the proposal link. */
export function proposalShareMessage(input: {
  clientFirstName: string;
  projectName: string;
  /** Formatted, e.g. "₹80,000". */
  total: string;
}): string {
  return `Hi ${input.clientFirstName}, here's the proposal for ${input.projectName} (${input.total}). You can read it and approve it here:`;
}

/**
 * What the WhatsApp message says with the client's link: the proposal while
 * it waits for an answer, the project page once it's approved.
 */
export function shareMessage(input: {
  status: ProjectStatus;
  clientFirstName: string;
  projectName: string;
  /** Formatted proposal total, e.g. "₹80,000". */
  total: string;
}): string {
  return isScopeApproved(input.status)
    ? `Hi ${input.clientFirstName}, here's the page for ${input.projectName}: what we agreed, the changes and the payments.`
    : proposalShareMessage(input);
}

/** Only drafts can be edited or deleted; after sending, scope is locked. */
export function isEditable(status: ProjectStatus): boolean {
  return status === "draft";
}

/** The client's latest answer to the sent proposal (summary; the full
 * signed record lives in the approvals module). */
export type ProjectDecision = {
  decision: "approved" | "rejected";
  at: Date;
  name: string;
  email: string;
  comment: string | null;
  approvalId: string;
};

export type ProjectTotals = {
  baseline: Minor;
  approvedChanges: Minor;
  pendingChanges: Minor;
  paid: Minor;
  due: Minor;
};

export type Project = {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  /** Every amount on the project is in this currency. Locked once sent. */
  currency: CurrencyCode;
  status: ProjectStatus;
  billingModel: BillingModel;
  baseline: {
    items: ScopeItem[];
    total: Minor;
    approvedAt: Date | null;
  };
  milestones: Milestone[];
  /** Optional proposal sections (overview, timeline, terms…). */
  proposal: ProposalContent;
  /**
   * False for projects created before proposal sections existed: their
   * proposal has never been saved, so the workspace's default text applies.
   * Once saved (even with sections cleared), the person's choice wins.
   */
  proposalSaved: boolean;
  /** When the proposal was last sent to the client (null: never). */
  sentAt: Date | null;
  lastDecision: ProjectDecision | null;
  /** A client link exists (it may be shown again; see portal). */
  hasPortalLink: boolean;
  /** How many change requests were ever created (CR numbers used). */
  changeCount: number;
  totals: ProjectTotals;
  createdAt: Date;
  updatedAt: Date;
};

export function emptyTotals(baseline: Minor): ProjectTotals {
  return {
    baseline,
    approvedChanges: minor(0),
    pendingChanges: minor(0),
    paid: minor(0),
    due: minor(0),
  };
}
