import "server-only";
import type { ClientSession, ObjectId } from "mongodb";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection, type WorkspaceOwned } from "@/shared/db/scoped";
import { minor } from "@/shared/lib/money";
import { DEFAULT_INVOICING, type InvoicingSettings } from "../domain/invoice";
import type {
  Invoice,
  InvoiceSnapshot,
  InvoiceStatus,
} from "../domain/snapshot";

// ── Settings and the number counter (one document per workspace) ───────────

type SettingsDoc = WorkspaceOwned & {
  settings?: InvoicingSettings;
  /** Last serial used, per financial year: { "2026-27": 14 }. */
  seq?: Record<string, number>;
};

const settingsCollection = (workspaceId: string) =>
  scopedCollection<SettingsDoc>(COLLECTIONS.invoicingSettings, workspaceId);

export async function findInvoicing(
  workspaceId: string,
  session?: ClientSession,
): Promise<InvoicingSettings> {
  const doc = await settingsCollection(workspaceId).findOne({}, { session });
  return { ...DEFAULT_INVOICING, ...doc?.settings };
}

/**
 * Saves the settings. The starting number only ever moves the counter
 * forward for this financial year, so a number can't be issued twice.
 */
export async function saveInvoicing(
  workspaceId: string,
  settings: InvoicingSettings,
  fyKey: string,
): Promise<void> {
  await settingsCollection(workspaceId).updateOne(
    {},
    {
      $set: { settings },
      $max: { [`seq.${fyKey}`]: settings.startNumber - 1 },
    },
    { upsert: true },
  );
}

/** The last serial used this financial year (0 before the first). */
export async function lastSerial(
  workspaceId: string,
  fyKey: string,
): Promise<number> {
  const doc = await settingsCollection(workspaceId).findOne(
    {},
    { projection: { seq: 1 } },
  );
  return doc?.seq?.[fyKey] ?? 0;
}

/** The next serial for this financial year (atomic, inside the issue transaction). */
export async function nextSerial(
  workspaceId: string,
  fyKey: string,
  session: ClientSession,
): Promise<number> {
  const doc = await settingsCollection(workspaceId).findOneAndUpdate(
    {},
    { $inc: { [`seq.${fyKey}`]: 1 } },
    { upsert: true, returnDocument: "after", session },
  );
  return doc?.seq?.[fyKey] ?? 1;
}

// ── Invoices (insert-only, apart from the status) ──────────────────────────

type InvoiceDoc = WorkspaceOwned &
  InvoiceSnapshot & {
    _id: ObjectId;
    projectId: ObjectId;
    paymentId: ObjectId;
    status: InvoiceStatus;
    issuedAt: Date;
    snapshotHash: string;
  };

const invoices = (workspaceId: string) =>
  scopedCollection<InvoiceDoc>(COLLECTIONS.invoices, workspaceId);

const m = (n: number) => minor(n);

function toInvoice(doc: InvoiceDoc): Invoice {
  const tax = doc.tax;
  return {
    ...doc,
    id: doc._id.toHexString(),
    projectId: doc.projectId.toHexString(),
    paymentId: doc.paymentId.toHexString(),
    subtotal: m(doc.subtotal),
    total: m(doc.total),
    lines: doc.lines.map((l) => ({ ...l, amount: m(l.amount) })),
    tax:
      tax.kind === "intra"
        ? { ...tax, cgst: m(tax.cgst), sgst: m(tax.sgst) }
        : tax.kind === "inter"
          ? { ...tax, igst: m(tax.igst) }
          : tax,
  };
}

export async function insertInvoice(
  workspaceId: string,
  doc: Pick<
    InvoiceDoc,
    "_id" | "projectId" | "paymentId" | "issuedAt" | "snapshotHash"
  > &
    InvoiceSnapshot,
  session: ClientSession,
): Promise<void> {
  await invoices(workspaceId).insertOne(
    { ...doc, status: "issued" },
    { session },
  );
}

/** Paid or cancelled, following its payment. */
export async function setInvoiceStatus(
  workspaceId: string,
  paymentId: ObjectId,
  status: InvoiceStatus,
  session?: ClientSession,
): Promise<void> {
  await invoices(workspaceId).updateOne(
    { paymentId },
    { $set: { status } },
    { session },
  );
}

export async function findInvoice(
  workspaceId: string,
  id: ObjectId,
  projectId?: ObjectId,
): Promise<Invoice | null> {
  const doc = await invoices(workspaceId).findOne(
    projectId ? { _id: id, projectId } : { _id: id },
  );
  return doc ? toInvoice(doc) : null;
}
