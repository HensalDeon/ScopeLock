"use server";

import { refresh } from "next/cache";
import {
  requireWorkspaceForWrite,
  workspaceAction,
} from "@/modules/workspace/server";
import { isStorageConfigured } from "@/shared/lib/env";
import { UserError, type FormState } from "@/shared/lib/form-state";
import { extensionFor } from "@/shared/lib/image-type";
import {
  deleteObject,
  keyBelongsTo,
  newStorageKey,
  putObject,
  signedUrl,
} from "@/shared/storage/r2";
import { readImageUpload } from "@/shared/storage/upload";
import {
  METHOD_FIELDS,
  methodsInputSchema,
  toMethods,
  type MethodField,
} from "../domain/methods";
import * as settingsRepo from "./settings-repository";

export type MethodsFormState = FormState<MethodField>;

// ── Payment methods (Settings → Payments) ──────────────────────────────────

export const updatePaymentMethods = workspaceAction(
  {
    fields: METHOD_FIELDS,
    schema: methodsInputSchema,
    roles: ["owner", "admin"],
    failureMessage: "Payment details weren't saved. Please try again.",
  },
  async (input, { workspace }) => {
    const { qrKey } = await settingsRepo.findMethods(workspace.workspaceId);
    const methods = toMethods(input, Boolean(qrKey));
    if (input.defaultMethod && !methods[input.defaultMethod]) {
      throw new UserError(
        "Fill in the method you chose as the default, or pick another.",
      );
    }
    // Keep the QR's label even while no image is uploaded.
    await settingsRepo.saveMethods(workspace.workspaceId, {
      ...methods,
      qr: { label: input.qrLabel ?? "Scan to pay" },
    });
    refresh();
    return { message: "Payment details saved." };
  },
);

export type QrResult =
  | { status: "success"; url: string | null }
  | { status: "error"; message: string };

const CAN_EDIT = new Set(["owner", "admin"]);

/** The QR image (another wallet or a merchant QR). Same checks as the logo. */
export async function uploadPaymentQr(formData: FormData): Promise<QrResult> {
  const { workspace, role } = await requireWorkspaceForWrite();
  if (!CAN_EDIT.has(role)) {
    return {
      status: "error",
      message: "Only the workspace owner or an admin can change this.",
    };
  }
  if (!isStorageConfigured()) {
    return {
      status: "error",
      message: "Image uploads aren't set up on this server yet.",
    };
  }
  const upload = await readImageUpload(formData.get("file"));
  if (!upload.ok) return { status: "error", message: upload.message };
  try {
    const key = newStorageKey(
      workspace.workspaceId,
      "payment-qr",
      extensionFor(upload.type),
    );
    await putObject(key, upload.buffer, upload.type);
    const previous = await settingsRepo.setQrKey(workspace.workspaceId, key);
    if (previous && keyBelongsTo(previous, workspace.workspaceId)) {
      await deleteObject(previous).catch(() => {});
    }
    refresh();
    return { status: "success", url: await signedUrl(key) };
  } catch (error) {
    console.error("[payments] QR upload failed", error);
    return {
      status: "error",
      message: "The QR image didn't upload. Please try again.",
    };
  }
}

export async function removePaymentQr(): Promise<QrResult> {
  const { workspace, role } = await requireWorkspaceForWrite();
  if (!CAN_EDIT.has(role)) {
    return {
      status: "error",
      message: "Only the workspace owner or an admin can change this.",
    };
  }
  const previous = await settingsRepo.setQrKey(workspace.workspaceId, null);
  if (
    previous &&
    isStorageConfigured() &&
    keyBelongsTo(previous, workspace.workspaceId)
  ) {
    await deleteObject(previous).catch(() => {});
  }
  refresh();
  return { status: "success", url: null };
}
