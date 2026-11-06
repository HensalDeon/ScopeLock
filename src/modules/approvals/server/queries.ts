import "server-only";
import { requireWorkspace } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import { hashSnapshot, SNAPSHOT_HASH_VERSION } from "@/shared/lib/hash";
import type { Approval } from "../domain/approval";
import { approvalSignatureValid } from "./evidence";
import {
  findApproval,
  findApprovalsForProject,
  toApproval,
  type ApprovalDoc,
} from "./repository";

export type CheckedApproval = Approval & {
  /** The snapshot still matches its hash and the record its signature. */
  intact: boolean;
};

/** A project's decisions, newest first, each re-verified on read. */
export async function listApprovalsForProject(
  projectId: string,
): Promise<CheckedApproval[]> {
  const id = parseObjectId(projectId);
  if (!id) return [];
  const { workspace } = await requireWorkspace();
  const docs = await findApprovalsForProject(workspace.workspaceId, id);
  return docs.map(checked);
}

function checked(doc: ApprovalDoc): CheckedApproval {
  return {
    ...toApproval(doc),
    intact:
      doc.hashVersion === SNAPSHOT_HASH_VERSION &&
      hashSnapshot(doc.snapshot) === doc.snapshotHash &&
      approvalSignatureValid(doc),
  };
}

/**
 * One answer with the exact content the client saw, for "View this
 * version". The snapshot is a ProposalDocumentData (baseline) or a
 * ChangeOrderData (change request); the caller renders it by subject type.
 */
export async function getApprovalWithSnapshot(
  projectId: string,
  approvalId: string,
): Promise<{ approval: CheckedApproval; snapshot: unknown } | null> {
  const project = parseObjectId(projectId);
  const id = parseObjectId(approvalId);
  if (!project || !id) return null;
  const { workspace } = await requireWorkspace();
  const doc = await findApproval(workspace.workspaceId, project, id);
  return doc ? { approval: checked(doc), snapshot: doc.snapshot } : null;
}
