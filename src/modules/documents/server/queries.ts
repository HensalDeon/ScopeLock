import "server-only";
import { requireWorkspace } from "@/modules/workspace/server";
import * as repo from "./repository";

/** The workspace's document style and default proposal text. */
export async function getDocumentSettings(): Promise<repo.DocumentSettings> {
  const { workspace } = await requireWorkspace();
  return repo.findDocumentSettings(workspace.workspaceId);
}
