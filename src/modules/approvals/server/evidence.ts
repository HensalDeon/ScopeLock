import "server-only";
import { canonicalJson } from "@/shared/lib/hash";
import { sign, verifySignature } from "@/shared/security/keys";
import type { ApprovalDoc } from "./repository";

/** Bump if the signed fields change; stored on every record. */
export const SIGNATURE_VERSION = 1;

type Signed = Omit<
  ApprovalDoc,
  "_id" | "snapshot" | "signature" | "createdAt" | "updatedAt"
>;

/**
 * The exact bytes the signature covers: every fact in the record, in
 * canonical form. The snapshot itself is covered through its hash.
 */
function payload(record: Signed): string {
  return canonicalJson({
    v: record.signatureVersion,
    workspaceId: record.workspaceId,
    projectId: record.projectId.toHexString(),
    subject: record.subject,
    decision: record.decision,
    decidedBy: record.decidedBy,
    comment: record.comment,
    decidedAt: record.decidedAt,
    snapshotHash: record.snapshotHash,
    hashVersion: record.hashVersion,
    ip: record.ip,
    userAgent: record.userAgent,
  });
}

/**
 * HMAC with a key derived from the app secret, which is not in the database:
 * someone with database access alone can't edit a record (or its snapshot)
 * and produce a valid signature.
 */
export function signApproval(record: Signed): string {
  return sign("evidence-v1", payload(record));
}

export function approvalSignatureValid(
  record: Signed & { signature: string },
): boolean {
  return (
    record.signatureVersion === SIGNATURE_VERSION &&
    verifySignature("evidence-v1", payload(record), record.signature)
  );
}
