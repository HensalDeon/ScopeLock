import "server-only";
import type { ClientSession, ObjectId } from "mongodb";
import { COLLECTIONS } from "@/shared/db/names";
import {
  scopedCollection,
  type NewDocument,
  type WorkspaceOwned,
} from "@/shared/db/scoped";
import type { Approval, ApprovalSubject, Decision } from "../domain/approval";

/**
 * EVIDENCE: insert and find only. There is deliberately no update or delete
 * here; a record, once written, is what the client agreed to.
 */
export type ApprovalDoc = WorkspaceOwned & {
  _id: ObjectId;
  projectId: ObjectId;
  subject: ApprovalSubject;
  decision: Decision;
  decidedBy: { name: string; email: string };
  comment: string | null;
  decidedAt: Date;
  /** Everything the client saw (the proposal as sent), from the database. */
  snapshot: Record<string, unknown>;
  snapshotHash: string;
  hashVersion: number;
  ip: string | null;
  userAgent: string | null;
  signature: string;
  signatureVersion: number;
};

const approvals = (workspaceId: string) =>
  scopedCollection<ApprovalDoc>(COLLECTIONS.approvals, workspaceId);

export function toApproval(doc: ApprovalDoc): Approval {
  return {
    id: doc._id.toHexString(),
    projectId: doc.projectId.toHexString(),
    subject: doc.subject,
    decision: doc.decision,
    decidedBy: doc.decidedBy,
    comment: doc.comment,
    decidedAt: doc.decidedAt,
    snapshotHash: doc.snapshotHash,
    hashVersion: doc.hashVersion,
    ip: doc.ip,
    userAgent: doc.userAgent,
    label: subjectLabel(doc),
  };
}

function subjectLabel(doc: ApprovalDoc): string {
  if (doc.subject.type === "baseline") return "Proposal";
  const { reference, title } = doc.snapshot as {
    reference?: unknown;
    title?: unknown;
  };
  return [reference, title].filter((v) => typeof v === "string").join(" ");
}

export async function insertApproval(
  workspaceId: string,
  doc: NewDocument<ApprovalDoc> & { _id: ObjectId },
  session: ClientSession,
): Promise<void> {
  await approvals(workspaceId).insertOne(doc, { session });
}

export async function findApproval(
  workspaceId: string,
  projectId: ObjectId,
  id: ObjectId,
): Promise<ApprovalDoc | null> {
  return approvals(workspaceId).findOne({ _id: id, projectId });
}

/** Newest first, one window at a time. */
export async function findApprovalsForProject(
  workspaceId: string,
  projectId: ObjectId,
  window: { skip: number; limit: number } = { skip: 0, limit: 50 },
): Promise<ApprovalDoc[]> {
  return approvals(workspaceId)
    .find(
      { projectId },
      {
        sort: { decidedAt: -1, _id: -1 },
        skip: window.skip,
        limit: window.limit,
      },
    )
    .toArray();
}

export async function countApprovalsForProject(
  workspaceId: string,
  projectId: ObjectId,
): Promise<number> {
  return approvals(workspaceId).countDocuments({ projectId });
}
