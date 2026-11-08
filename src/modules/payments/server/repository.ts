import "server-only";
import { MongoServerError, type ClientSession, type ObjectId } from "mongodb";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection, type WorkspaceOwned } from "@/shared/db/scoped";
import type { CurrencyCode } from "@/shared/lib/currency";
import { minor } from "@/shared/lib/money";
import {
  NO_METHODS,
  type MethodKind,
  type PaymentMethods,
} from "../domain/methods";
import type { Payment, PaymentLine, PaymentStatus } from "../domain/payment";

// ── Payment methods (one document per workspace) ───────────────────────────

type SettingsDoc = WorkspaceOwned & {
  methods?: Omit<PaymentMethods, "qr"> & { qr: { label: string } | null };
  /** R2 key of the uploaded QR image (private bucket). */
  qrKey?: string | null;
};

const settings = (workspaceId: string) =>
  scopedCollection<SettingsDoc>(COLLECTIONS.paymentSettings, workspaceId);

export async function findMethods(
  workspaceId: string,
): Promise<{ methods: PaymentMethods; qrKey: string | null }> {
  const doc = await settings(workspaceId).findOne();
  const qrKey = doc?.qrKey ?? null;
  const m = doc?.methods;
  return {
    qrKey,
    methods: m
      ? {
          ...m,
          qr: qrKey
            ? { label: m.qr?.label ?? "Scan to pay", hasImage: true }
            : null,
        }
      : NO_METHODS,
  };
}

export async function saveMethods(
  workspaceId: string,
  methods: NonNullable<SettingsDoc["methods"]>,
): Promise<void> {
  await settings(workspaceId).updateOne(
    {},
    { $set: { methods } },
    { upsert: true },
  );
}

/** Points the QR image at a new object (or none); returns the key it replaced. */
export async function setQrKey(
  workspaceId: string,
  key: string | null,
): Promise<string | null> {
  const before = await settings(workspaceId).findOneAndUpdate(
    {},
    { $set: { qrKey: key } },
    { upsert: true, returnDocument: "before" },
  );
  return before?.qrKey ?? null;
}

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
  };
}

/** Asks for a payment. Null if this slot already has an open request. */
export async function insertPayment(
  workspaceId: string,
  doc: Pick<
    PaymentDoc,
    "projectId" | "key" | "label" | "lines" | "amount" | "currency"
  > & {
    by: { userId: string; name: string };
  },
): Promise<string | null> {
  const now = new Date();
  try {
    const { insertedId } = await payments(workspaceId).insertOne({
      projectId: doc.projectId,
      key: doc.key,
      label: doc.label,
      lines: doc.lines,
      amount: doc.amount,
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
    });
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

/** Received, for the overview's money figures. */
export async function sumReceived(
  workspaceId: string,
): Promise<{ currency: CurrencyCode; total: number }[]> {
  const rows = (await payments(workspaceId)
    .aggregate([
      { $match: { status: "confirmed" } },
      { $group: { _id: "$currency", total: { $sum: "$amount" } } },
    ])
    .toArray()) as { _id: CurrencyCode; total: number }[];
  return rows.map((r) => ({ currency: r._id, total: r.total }));
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
): Promise<boolean> {
  const { matchedCount } = await payments(workspaceId).updateOne(
    { _id: id, status: { $in: from } },
    {
      $set: set,
      $push: { history },
      ...(unsetOpen ? { $unset: { open: "" } } : {}),
    },
  );
  return matchedCount === 1;
}

export const cancelPayment = (ws: string, id: ObjectId, by: Who) =>
  transition(
    ws,
    id,
    ["due", "client_reported"],
    { status: "cancelled" },
    entry("cancelled", by),
    true,
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
) =>
  transition(
    ws,
    id,
    ["due", "client_reported"],
    { status: "confirmed", confirmation },
    entry("confirmed", { kind: "member", name: confirmation.by.name }),
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
