import "server-only";
import type { ClientSession, ObjectId } from "mongodb";
import { setChangeTotals } from "@/modules/projects/server";
import { minor } from "@/shared/lib/money";
import { changeTotals } from "../domain/change-request";
import { findChangeStatuses } from "./repository";

/**
 * Recomputes the project's approved / pending change totals from the CRs
 * themselves (never incremented by hand, so they can't drift).
 */
export async function refreshChangeTotals(
  workspaceId: string,
  projectId: ObjectId,
  session?: ClientSession,
): Promise<void> {
  const rows = await findChangeStatuses(workspaceId, projectId, session);
  await setChangeTotals(
    workspaceId,
    projectId,
    changeTotals(
      rows.map((r) => ({ status: r.status, total: minor(r.total) })),
    ),
    session,
  );
}
