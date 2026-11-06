import "server-only";
import { requireWorkspace } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import { hashSnapshot, SNAPSHOT_HASH_VERSION } from "@/shared/lib/hash";
import type { Approval } from "../domain/approval";
import { approvalSignatureValid } from "./evidence";
import { findApprovalsForProject, toApproval } from "./repository";

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
  return docs.map((doc) => ({
    ...toApproval(doc),
    intact:
      doc.hashVersion === SNAPSHOT_HASH_VERSION &&
      hashSnapshot(doc.snapshot) === doc.snapshotHash &&
      approvalSignatureValid(doc),
  }));
}
