"use server";

import { refresh } from "next/cache";
import { requireWorkspaceForWrite } from "@/modules/workspace/server";
import { isStorageConfigured } from "@/shared/lib/env";
import { extensionFor } from "@/shared/lib/image-type";
import {
  deleteObject,
  keyBelongsTo,
  newStorageKey,
  putObject,
  signedUrl,
} from "@/shared/storage/r2";
import { readImageUpload } from "@/shared/storage/upload";
import { DOCUMENT_IMAGE_KINDS, type DocumentImageKind } from "../domain/images";
import * as repo from "./repository";

export type ImageActionResult =
  | { status: "success"; url: string | null }
  | { status: "error"; message: string };

const CAN_EDIT = new Set(["owner", "admin"]);

/** Only "logo" or "cover": other storage kinds belong to other modules. */
function parseKind(value: FormDataEntryValue | null): DocumentImageKind | null {
  return DOCUMENT_IMAGE_KINDS.find((kind) => kind === value) ?? null;
}

async function deleteQuietly(key: string | null, workspaceId: string) {
  if (!key || !keyBelongsTo(key, workspaceId)) return;
  try {
    await deleteObject(key);
  } catch (error) {
    // The new image is already saved; an orphaned old file is harmless.
    console.error("[documents] could not delete old image", error);
  }
}

/**
 * Upload the logo or cover image. Not a workspaceAction because it carries a
 * file, but it makes the same checks: fresh session, membership, role. The
 * bytes are checked here, whatever the browser claimed.
 */
export async function uploadDocumentImage(
  formData: FormData,
): Promise<ImageActionResult> {
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
  const kind = parseKind(formData.get("kind"));
  if (!kind) return { status: "error", message: "Choose an image to upload." };
  const upload = await readImageUpload(formData.get("file"));
  if (!upload.ok) return { status: "error", message: upload.message };
  const { buffer, type } = upload;

  try {
    const key = newStorageKey(workspace.workspaceId, kind, extensionFor(type));
    await putObject(key, buffer, type);
    const previous = await repo.setDocumentImage(
      workspace.workspaceId,
      kind,
      key,
    );
    await deleteQuietly(previous, workspace.workspaceId);
    refresh();
    return { status: "success", url: await signedUrl(key) };
  } catch (error) {
    console.error("[documents] image upload failed", error);
    return {
      status: "error",
      message: "The image didn't upload. Please try again.",
    };
  }
}

export async function removeDocumentImage(
  formData: FormData,
): Promise<ImageActionResult> {
  const { workspace, role } = await requireWorkspaceForWrite();
  if (!CAN_EDIT.has(role)) {
    return {
      status: "error",
      message: "Only the workspace owner or an admin can change this.",
    };
  }
  const kind = parseKind(formData.get("kind"));
  if (!kind)
    return {
      status: "error",
      message: "Something went wrong. Refresh and try again.",
    };
  try {
    const previous = await repo.setDocumentImage(
      workspace.workspaceId,
      kind,
      null,
    );
    if (isStorageConfigured())
      await deleteQuietly(previous, workspace.workspaceId);
    refresh();
    return { status: "success", url: null };
  } catch (error) {
    console.error("[documents] image removal failed", error);
    return {
      status: "error",
      message: "The image wasn't removed. Please try again.",
    };
  }
}
