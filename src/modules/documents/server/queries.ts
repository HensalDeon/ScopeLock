import "server-only";
import { getWorkspacePlan } from "@/modules/billing/server";
import { requireWorkspace } from "@/modules/workspace/server";
import { signedUrls } from "@/shared/storage/r2";
import type { DocumentImages } from "../domain/images";
import * as repo from "./repository";

/**
 * Document settings as clients see them: `branded` is whether the plan
 * shows the workspace's own logo (Pro and Agency). On Free, documents show
 * the business's initials instead, and the client pages say "Sent with
 * ScopeLock".
 */
export type ClientLookSettings = repo.DocumentSettings & { branded: boolean };

/** Whether the workspace's plan includes its own branding for clients. */
export async function isBranded(workspaceId: string): Promise<boolean> {
  const { plan } = await getWorkspacePlan(workspaceId);
  return plan.features.brandedClientPages;
}

/** The workspace's document style, default text and image keys. */
export async function getDocumentSettings(): Promise<ClientLookSettings> {
  const { workspace } = await requireWorkspace();
  const [settings, branded] = await Promise.all([
    repo.findDocumentSettings(workspace.workspaceId),
    isBranded(workspace.workspaceId),
  ]);
  return { ...settings, branded };
}

/**
 * For the public client portal only: the workspace comes from the project
 * found by its link's hash, never from the request.
 */
export async function getPortalDocumentSettings(
  workspaceId: string,
): Promise<ClientLookSettings> {
  const [settings, branded] = await Promise.all([
    repo.findDocumentSettings(workspaceId),
    isBranded(workspaceId),
  ]);
  return { ...settings, branded };
}

/**
 * Short-lived URLs for the logo and cover image, as clients see them: no
 * logo unless the plan includes branding.
 */
export async function getDocumentImages(
  settings: ClientLookSettings,
): Promise<DocumentImages> {
  const { logo, cover } = await signedUrls({
    logo: settings.branded ? settings.images.logoKey : null,
    cover: settings.images.coverKey,
  });
  return { logoUrl: logo, coverUrl: cover };
}

/** For the style editor: the uploaded images, whatever the plan. */
export async function getEditorImages(
  settings: repo.DocumentSettings,
): Promise<DocumentImages> {
  const { logo, cover } = await signedUrls({
    logo: settings.images.logoKey,
    cover: settings.images.coverKey,
  });
  return { logoUrl: logo, coverUrl: cover };
}
