"use server";

import { refresh } from "next/cache";
import { requireWorkspaceForWrite } from "@/modules/workspace/server";
import { isStorageConfigured } from "@/shared/lib/env";
import { detectImageType, extensionFor } from "@/shared/lib/image-type";
import {
  deleteObject,
  keyBelongsTo,
  newStorageKey,
  putObject,
  signedUrl,
  STORAGE_KINDS,
  type StorageKind,
} from "@/shared/storage/r2";
import { MAX_UPLOAD_BYTES } from "../domain/images";
import * as repo from "./repository";

export type ImageActionResult =
  | { status: "success"; url: string | null }
  | { status: "error"; message: string };

const CAN_EDIT = new Set(["owner", "admin"]);

function parseKind(value: FormDataEntryValue | null): StorageKind | null {
  return STORAGE_KINDS.find((kind) => kind === value) ?? null;
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
  const file = formData.get("file");
  if (!kind || !(file instanceof File)) {
    return { status: "error", message: "Choose an image to upload." };
  }
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    return {
      status: "error",
      message: "That image is too large. Use one under 4 MB.",
    };
  }

  const buffer = await file.arrayBuffer();
  const type = detectImageType(
    new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength)),
  );
  if (!type) {
    return { status: "error", message: "Use a PNG, JPG or WebP image." };
  }

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
