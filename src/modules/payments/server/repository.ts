import "server-only";
import { MongoServerError, type ClientSession, type ObjectId } from "mongodb";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection, type WorkspaceOwned } from "@/shared/db/scoped";
import type { CurrencyCode } from "@/shared/lib/currency";
import { minor } from "@/shared/lib/money";
import { type MethodKind } from "../domain/methods";
import type { Payment, PaymentLine, PaymentStatus } from "../domain/payment";

// ── Payment requests ───────────────────────────────────────────────────────

type Who = { kind: "member" | "client"; name: string };
type HistoryEntry = {
  status: PaymentStatus;
  at: Date;
  by: Who;
  note: string | null;
};

export type PaymentDoc = WorkspaceOwned & {
  _id: ObjectId;
  projectId: ObjectId;
  key: string;
  label: string;
  lines: PaymentLine[];
  amount: number;
  /** GST on its invoice (absent on requests from before invoices). */
  tax?: number;
  invoice?: { id: ObjectId; number: string };
  currency: CurrencyCode;
  status: PaymentStatus;
  /** Present (true) while the request is open; removed on cancel. */
  open?: true;
  requestedAt: Date;
  requestedBy: { userId: string; name: string };
  report: {
    method: MethodKind;
    reference: string;
    paidOn: string;
    note: string | null;
    proofKey: string | null;
    reportedAt: Date;
  } | null;
  confirmation: {
    method: MethodKind;
    reference: string | null;
    receivedOn: string;
    confirmedAt: Date;
    by: { userId: string; name: string };
  } | null;
  history: HistoryEntry[];
  /** Automatic reminders sent to the client, and the freelancer's pause. */
  autoReminders?: { sent?: Date[]; paused?: boolean; pausedUntil?: Date };
};

const payments = (workspaceId: string) =>
  scopedCollection<PaymentDoc>(COLLECTIONS.payments, workspaceId);

export function toPayment(doc: PaymentDoc): Payment {
  const rejection = [...doc.history]
    .reverse()
    .find((h) => h.status === "due" && h.by.kind === "member" && h.note);
  return {
    id: doc._id.toHexString(),
    projectId: doc.projectId.toHexString(),
    key: doc.key,
    label: doc.label,
    lines: doc.lines.map((l) => ({ ...l, amount: minor(l.amount) })),
    amount: minor(doc.amount),
    tax: minor(doc.tax ?? 0),
    payable: minor(doc.amount + (doc.tax ?? 0)),
    invoice: doc.invoice
      ? { id: doc.invoice.id.toHexString(), number: doc.invoice.number }
      : null,
    currency: doc.currency,
    status: doc.status,
    requestedAt: doc.requestedAt,
    report: doc.report
      ? {
          method: doc.report.method,
          reference: doc.report.reference,
          paidOn: doc.report.paidOn,
          note: doc.report.note,
          hasProof: Boolean(doc.report.proofKey),
          reportedAt: doc.report.reportedAt,
        }
      : null,
    confirmation: doc.confirmation
      ? {
          method: doc.confirmation.method,
          reference: doc.confirmation.reference,
          receivedOn: doc.confirmation.receivedOn,
          confirmedAt: doc.confirmation.confirmedAt,
          by: doc.confirmation.by.name,
        }
      : null,
    // Only a rejection after the latest report counts as current.
    lastRejection:
      doc.status === "due" && rejection?.note
        ? { note: rejection.note, at: rejection.at }
        : null,
    dueSince:
      doc.history.findLast((h) => h.status === "due")?.at ?? doc.requestedAt,
    autoReminders: {
      sent: doc.autoReminders?.sent ?? [],
      paused: doc.autoReminders?.paused === true,
      pausedUntil: doc.autoReminders?.pausedUntil ?? null,
    },
  };
}

/** Asks for a payment. Null if this slot already has an open request. */
export async function insertPayment(
  workspaceId: string,
  doc: Partial<Pick<PaymentDoc, "_id" | "tax" | "invoice">> &
    Pick<
      PaymentDoc,
      "projectId" | "key" | "label" | "lines" | "amount" | "currency"
    > & {
      by: { userId: string; name: string };
    },
  session?: ClientSession,
): Promise<string | null> {
  const now = new Date();
  try {
    const { insertedId } = await payments(workspaceId).insertOne(
      {
        ...(doc._id !== undefined ? { _id: doc._id } : {}),
        projectId: doc.projectId,
        key: doc.key,
        label: doc.label,
        lines: doc.lines,
        amount: doc.amount,
        ...(doc.tax !== undefined ? { tax: doc.tax } : {}),
        ...(doc.invoice !== undefined ? { invoice: doc.invoice } : {}),
        currency: doc.currency,
        status: "due",
        open: true,
        requestedAt: now,
        requestedBy: doc.by,
        report: null,
        confirmation: null,
        history: [
          {
            status: "due",
            at: now,
            by: { kind: "member", name: doc.by.name },
            note: null,
          },
        ],
      },
      { session },
    );
    return insertedId.toHexString();
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return null;
    throw error;
  }
}

export async function findPaymentDocs(
  workspaceId: string,
  projectId: ObjectId,
  session?: ClientSession,
): Promise<PaymentDoc[]> {
  return payments(workspaceId)
    .find({ projectId }, { sort: { requestedAt: 1 }, limit: 200, session })
    .toArray();
}

export async function findPaymentDoc(
  workspaceId: string,
  projectId: ObjectId,
  id: ObjectId,
): Promise<PaymentDoc | null> {
  return payments(workspaceId).findOne({ _id: id, projectId });
}

/**
 * Change-request money that has been received: the CR lines of confirmed
 * payments (the work's value, before GST), for "revenue recovered".
 */
export async function findReceivedChangeAmounts(
  workspaceId: string,
): Promise<{ currency: CurrencyCode; amount: number }[]> {
  const docs = await payments(workspaceId)
    .find(
      { status: "confirmed", "lines.kind": "change_request" },
      { projection: { currency: 1, lines: 1 } },
    )
    .toArray();
  return docs.flatMap((d) =>
    d.lines
      .filter((l) => l.kind === "change_request")
      .map((l) => ({ currency: d.currency, amount: l.amount })),
  );
}

/** Still owed across the workspace, oldest first (the overview). */
export async function findOwedPaymentDocs(
  workspaceId: string,
): Promise<PaymentDoc[]> {
  return payments(workspaceId)
    .find(
      { status: { $in: ["due", "client_reported"] } },
      { sort: { requestedAt: 1 }, limit: 100 },
    )
    .toArray();
}

const entry = (
  status: PaymentStatus,
  by: Who,
  note: string | null = null,
): HistoryEntry => ({
  status,
  at: new Date(),
  by,
  note,
});

/** Atomic status change; false if the payment wasn't in an allowed state. */
async function transition(
  workspaceId: string,
  id: ObjectId,
  from: PaymentStatus[],
  set: Partial<PaymentDoc>,
  history: HistoryEntry,
  unsetOpen = false,
  session?: ClientSession,
): Promise<boolean> {
  const { matchedCount } = await payments(workspaceId).updateOne(
    { _id: id, status: { $in: from } },
    {
      $set: set,
      $push: { history },
      ...(unsetOpen ? { $unset: { open: "" } } : {}),
    },
    { session },
  );
  return matchedCount === 1;
}

export const cancelPayment = (
  ws: string,
  id: ObjectId,
  by: Who,
  session?: ClientSession,
) =>
  transition(
    ws,
    id,
    ["due", "client_reported"],
    { status: "cancelled" },
    entry("cancelled", by),
    true,
    session,
  );

export const reportPayment = (
  ws: string,
  id: ObjectId,
  report: NonNullable<PaymentDoc["report"]>,
  by: Who,
) =>
  transition(
    ws,
    id,
    ["due"],
    { status: "client_reported", report },
    entry("client_reported", by, report.note),
  );

export const confirmPayment = (
  ws: string,
  id: ObjectId,
  confirmation: NonNullable<PaymentDoc["confirmation"]>,
  session?: ClientSession,
) =>
  transition(
    ws,
    id,
    ["due", "client_reported"],
    { status: "confirmed", confirmation },
    entry("confirmed", { kind: "member", name: confirmation.by.name }),
    false,
    session,
  );

/** "Not received": back to due, with a note the client sees. */
export const rejectReport = (ws: string, id: ObjectId, note: string, by: Who) =>
  transition(
    ws,
    id,
    ["client_reported"],
    { status: "due" },
    entry("due", by, note),
  );

/** For the proof download: the stored key, only for this workspace. */
export async function findProofKey(
  workspaceId: string,
  id: ObjectId,
): Promise<string | null> {
  const doc = await payments(workspaceId).findOne(
    { _id: id },
    { projection: { report: 1 } },
  );
  return doc?.report?.proofKey ?? null;
}
