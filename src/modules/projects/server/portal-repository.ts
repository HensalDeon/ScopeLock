import "server-only";
import type { ClientSession, ObjectId } from "mongodb";
// eslint-disable-next-line no-restricted-imports -- only for findByPortalTokenHash (reviewed public lookup)
import { collection } from "@/shared/db/collections";
import { COLLECTIONS } from "@/shared/db/names";
import type { Project, ProjectDecision } from "../domain/project";

import {
  projects,
  toProject,
  type PortalLink,
  type ProjectDoc,
  type SentProposal,
} from "./project-docs";

/** Sending a proposal, the client's answer, and the portal link. */

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
