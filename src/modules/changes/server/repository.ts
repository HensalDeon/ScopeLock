import "server-only";
import type { ClientSession, ObjectId } from "mongodb";
import type { ChangeOrderData } from "@/modules/documents";
import { COLLECTIONS } from "@/shared/db/names";
import {
  scopedCollection,
  type NewDocument,
  type WorkspaceOwned,
} from "@/shared/db/scoped";
import type { CurrencyCode } from "@/shared/lib/currency";
import { minor } from "@/shared/lib/money";
import type {
  ChangeBilling,
  ChangeItem,
  ChangeRequest,
  ChangeStatus,
  SourceChannel,
} from "../domain/change-request";

export type SentChange = {
  /** The change order exactly as the client sees and approves it. */
  data: ChangeOrderData;
  sentAt: Date;
  sentBy: { userId: string; email: string };
};

export type ChangeDoc = WorkspaceOwned & {
  _id: ObjectId;
  projectId: ObjectId;
  number: number;
  title: string;
  description: string | null;
  items: ChangeItem[];
  total: number;
  currency: CurrencyCode;
  billing: ChangeBilling;
  source: { channel: SourceChannel; note: string | null } | null;
  status: ChangeStatus;
  everSent: boolean;
  sent: SentChange | null;
  decision: {
    decision: "approved" | "rejected";
    at: Date;
    name: string;
    email: string;
    comment: string | null;
    approvalId: ObjectId;
  } | null;
  /** Fixed when approved: which payment(s) the money joins. */
  placement?: { milestoneId: string | null; amount: number }[] | null;
};

export type ChangeData = Pick<
  ChangeDoc,
  "title" | "description" | "items" | "total" | "billing" | "source"
>;

const changes = (workspaceId: string) =>
  scopedCollection<ChangeDoc>(COLLECTIONS.changeRequests, workspaceId);

export function toChange(doc: ChangeDoc): ChangeRequest {
  return {
    id: doc._id.toHexString(),
    projectId: doc.projectId.toHexString(),
    number: doc.number,
    title: doc.title,
    description: doc.description,
    items: doc.items.map((item) => ({ ...item, amount: minor(item.amount) })),
    total: minor(doc.total),
    currency: doc.currency,
    billing: doc.billing,
    source: doc.source,
    status: doc.status,
    everSent: doc.everSent,
    sentAt: doc.sent?.sentAt ?? null,
    decision: doc.decision
      ? { ...doc.decision, approvalId: doc.decision.approvalId.toHexString() }
      : null,
    placement: doc.placement
      ? doc.placement.map((p) => ({
          milestoneId: p.milestoneId,
          amount: minor(p.amount),
        }))
      : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function insertChange(
  workspaceId: string,
  doc: Omit<
    NewDocument<ChangeDoc>,
    "status" | "everSent" | "sent" | "decision"
  >,
): Promise<void> {
  await changes(workspaceId).insertOne({
    ...doc,
    status: "draft",
    everSent: false,
    sent: null,
    decision: null,
  });
}

export async function findChangeDoc(
  workspaceId: string,
  projectId: ObjectId,
  number: number,
): Promise<ChangeDoc | null> {
  return changes(workspaceId).findOne({ projectId, number });
}

export async function findChangeDocs(
  workspaceId: string,
  projectId: ObjectId,
): Promise<ChangeDoc[]> {
  return changes(workspaceId)
    .find({ projectId }, { sort: { number: -1 }, limit: 200 })
    .toArray();
}

/** Drafts only (atomic). */
export async function updateDraftChange(
  workspaceId: string,
  id: ObjectId,
  data: ChangeData,
): Promise<boolean> {
  const { matchedCount } = await changes(workspaceId).updateOne(
    { _id: id, status: "draft" },
    { $set: data },
  );
  return matchedCount === 1;
}

/** Only drafts that were never sent: the client never saw them. */
export async function deleteUnsentDraft(
  workspaceId: string,
  id: ObjectId,
): Promise<boolean> {
  const { deletedCount } = await changes(workspaceId).deleteOne({
    _id: id,
    status: "draft",
    everSent: false,
  });
  return deletedCount === 1;
}

/** Draft → sent, freezing the change order the client will see. */
export async function markChangeSent(
  workspaceId: string,
  id: ObjectId,
  sent: SentChange,
): Promise<boolean> {
  const { matchedCount } = await changes(workspaceId).updateOne(
    { _id: id, status: "draft" },
    { $set: { status: "sent", everSent: true, sent } },
  );
  return matchedCount === 1;
}

/** Sent → draft, to edit before the client answers. */
export async function markChangeWithdrawn(
  workspaceId: string,
  id: ObjectId,
): Promise<boolean> {
  const { matchedCount } = await changes(workspaceId).updateOne(
    { _id: id, status: "sent" },
    { $set: { status: "draft" } },
  );
  return matchedCount === 1;
}

/** A draft the client has seen before → cancelled for good. */
export async function markChangeCancelled(
  workspaceId: string,
  id: ObjectId,
): Promise<boolean> {
  const { matchedCount } = await changes(workspaceId).updateOne(
    { _id: id, status: "draft", everSent: true },
    { $set: { status: "withdrawn" } },
  );
  return matchedCount === 1;
}

/**
 * The client's answer, inside the caller's transaction. Guarded: only while
 * sent, and only for the version the client saw (sentAt).
 */
export async function applyChangeDecision(
  input: {
    workspaceId: string;
    id: ObjectId;
    sentAt: Date;
    decision: "approved" | "rejected";
    approvalId: ObjectId;
    at: Date;
    name: string;
    email: string;
    comment: string | null;
    /** Approved only: where the money goes, fixed now. */
    placement: { milestoneId: string | null; amount: number }[] | null;
  },
  session: ClientSession,
): Promise<boolean> {
  const updated = await changes(input.workspaceId).findOneAndUpdate(
    { _id: input.id, status: "sent", "sent.sentAt": input.sentAt },
    {
      $set: {
        status: input.decision,
        decision: {
          decision: input.decision,
          at: input.at,
          name: input.name,
          email: input.email,
          comment: input.comment,
          approvalId: input.approvalId,
        },
        placement: input.decision === "approved" ? input.placement : null,
      },
    },
    { session },
  );
  return updated !== null;
}

/** Status and total of every CR on a project, for its totals. */
export async function findChangeStatuses(
  workspaceId: string,
  projectId: ObjectId,
  session?: ClientSession,
): Promise<{ status: ChangeStatus; total: number }[]> {
  return changes(workspaceId)
    .find({ projectId }, { projection: { status: 1, total: 1 }, session })
    .toArray();
}

/** Approved change requests' value and date, for "revenue recovered". */
export async function findApprovedChangeTotals(workspaceId: string): Promise<
  {
    id: string;
    currency: CurrencyCode;
    total: number;
    approvedAt: Date;
    projectId: string;
    number: number;
    title: string;
  }[]
> {
  const docs = await changes(workspaceId)
    .find(
      { status: "approved" },
      {
        projection: {
          currency: 1,
          total: 1,
          "decision.at": 1,
          projectId: 1,
          number: 1,
          title: 1,
        },
      },
    )
    .toArray();
  return docs.flatMap((d) =>
    d.decision
      ? [
          {
            id: d._id.toHexString(),
            currency: d.currency,
            total: d.total,
            approvedAt: d.decision.at,
            projectId: d.projectId.toHexString(),
            number: d.number,
            title: d.title,
          },
        ]
      : [],
  );
}

/** Sent and draft CRs across the workspace (for the overview). */
export async function findOpenChangeDocs(
  workspaceId: string,
): Promise<ChangeDoc[]> {
  return changes(workspaceId)
    .find(
      { status: { $in: ["sent", "draft"] } },
      { sort: { updatedAt: -1 }, limit: 100 },
    )
    .toArray();
}
