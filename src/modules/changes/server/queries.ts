import "server-only";
import { notFound } from "next/navigation";
import type { ChangeOrderData } from "@/modules/documents";
import { requireWorkspace } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import type { CurrencyCode } from "@/shared/lib/currency";
import { minor, type Minor } from "@/shared/lib/money";
import {
  parseChangeNumber,
  type ChangeRequest,
} from "../domain/change-request";
import * as repo from "./repository";

/** A project's change requests, newest first. */
export async function listChanges(projectId: string): Promise<ChangeRequest[]> {
  const id = parseObjectId(projectId);
  if (!id) return [];
  const { workspace } = await requireWorkspace();
  return (await repo.findChangeDocs(workspace.workspaceId, id)).map(
    repo.toChange,
  );
}

/** For pages: one CR (by its number in the URL) and what was sent, or 404. */
export async function getChangeOrNotFound(
  projectId: string,
  numberParam: string,
): Promise<{ change: ChangeRequest; sent: ChangeOrderData | null }> {
  const id = parseObjectId(projectId);
  const number = parseChangeNumber(numberParam);
  if (!id || !number) notFound();
  const { workspace } = await requireWorkspace();
  const doc = await repo.findChangeDoc(workspace.workspaceId, id, number);
  if (!doc) notFound();
  return { change: repo.toChange(doc), sent: doc.sent?.data ?? null };
}

/** Change requests waiting on the client or still in draft, workspace-wide. */
export async function listOpenChanges(): Promise<ChangeRequest[]> {
  const { workspace } = await requireWorkspace();
  return (await repo.findOpenChangeDocs(workspace.workspaceId)).map(
    repo.toChange,
  );
}

/** Every approved change's value and date, for the overview's "recovered". */
export async function listApprovedChangeTotals(): Promise<
  {
    currency: CurrencyCode;
    total: Minor;
    approvedAt: Date;
    projectId: string;
    number: number;
    title: string;
  }[]
> {
  const { workspace } = await requireWorkspace();
  return (await repo.findApprovedChangeTotals(workspace.workspaceId)).map(
    (c) => ({ ...c, total: minor(c.total) }),
  );
}
