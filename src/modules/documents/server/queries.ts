import "server-only";
import { requireWorkspace } from "@/modules/workspace/server";
import { signedUrls } from "@/shared/storage/r2";
import type { DocumentImages } from "../domain/images";
import * as repo from "./repository";

/** The workspace's document style, default text and image keys. */
export async function getDocumentSettings(): Promise<repo.DocumentSettings> {
  const { workspace } = await requireWorkspace();
  return repo.findDocumentSettings(workspace.workspaceId);
}

/**
 * For the public client portal only: the workspace comes from the project
 * found by its link's hash, never from the request.
 */
export async function getPortalDocumentSettings(
  workspaceId: string,
): Promise<repo.DocumentSettings> {
  return repo.findDocumentSettings(workspaceId);
}

/** Short-lived URLs for the logo and cover image, for rendering documents. */
export async function getDocumentImages(
  settings: repo.DocumentSettings,
): Promise<DocumentImages> {
  const { logo, cover } = await signedUrls({
    logo: settings.images.logoKey,
    cover: settings.images.coverKey,
  });
  return { logoUrl: logo, coverUrl: cover };
}
