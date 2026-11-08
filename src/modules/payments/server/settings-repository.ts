import "server-only";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection, type WorkspaceOwned } from "@/shared/db/scoped";
import { NO_METHODS, type PaymentMethods } from "../domain/methods";

/** Payment methods and the QR image: one settings document per workspace. */

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
