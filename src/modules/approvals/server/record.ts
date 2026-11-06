import "server-only";
import { ObjectId, type ClientSession } from "mongodb";
import { hashSnapshot, SNAPSHOT_HASH_VERSION } from "@/shared/lib/hash";
import type { ApprovalSubject, DecisionInput } from "../domain/approval";
import { signApproval, SIGNATURE_VERSION } from "./evidence";
import { insertApproval } from "./repository";

/**
 * Writes the signed evidence record inside the caller's transaction. The
 * snapshot must come from the database (what was sent), never the request.
 * Throws a duplicate-key error if this subject is already approved.
 */
export async function recordDecision(
  input: {
    workspaceId: string;
    projectId: ObjectId;
    subject: ApprovalSubject;
    decision: DecisionInput;
    decidedAt: Date;
    snapshot: Record<string, unknown>;
    ip: string | null;
    userAgent: string | null;
  },
  session: ClientSession,
): Promise<ObjectId> {
  const _id = new ObjectId();
  const facts = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    subject: input.subject,
    decision: input.decision.decision,
    decidedBy: { name: input.decision.name, email: input.decision.email },
    comment: input.decision.comment,
    decidedAt: input.decidedAt,
    snapshotHash: hashSnapshot(input.snapshot),
    hashVersion: SNAPSHOT_HASH_VERSION,
    ip: input.ip,
    userAgent: input.userAgent,
    signatureVersion: SIGNATURE_VERSION,
  };
  const signature = signApproval(facts);
  // workspaceId is stamped by the scoped collection.
  const { workspaceId, ...rest } = facts;
  await insertApproval(
    workspaceId,
    { _id, ...rest, snapshot: input.snapshot, signature },
    session,
  );
  return _id;
}
