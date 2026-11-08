import "server-only";
import { requireWorkspace } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import { financialYear } from "@/shared/lib/india";
import {
  GST_RATE_PERCENT,
  invoiceNumber,
  type Buyer,
  type InvoicingSettings,
} from "../domain/invoice";
import { gstHints } from "../domain/preview";
import type { Invoice } from "../domain/snapshot";
import * as repo from "./repository";

/** Settings → Invoicing, with the number the next invoice will get. */
export async function getInvoicing(): Promise<{
  settings: InvoicingSettings;
  nextNumber: string;
}> {
  const { workspace } = await requireWorkspace();
  const ws = workspace.workspaceId;
  const fy = financialYear(new Date());
  const [settings, last] = await Promise.all([
    repo.findInvoicing(ws),
    repo.lastSerial(ws, fy.key),
  ]);
  return {
    settings,
    nextNumber: invoiceNumber(
      settings.prefix,
      fy.short,
      Math.max(last + 1, settings.startNumber),
    ),
  };
}

/** The signed-in workspace's invoice on this project, or null. */
export async function getInvoice(
  projectId: string,
  invoiceId: string,
): Promise<Invoice | null> {
  const project = parseObjectId(projectId);
  const id = parseObjectId(invoiceId);
  if (!project || !id) return null;
  const { workspace } = await requireWorkspace();
  return repo.findInvoice(workspace.workspaceId, id, project);
}

/**
 * The GST rate a proposal or change request should show ("plus 18% GST"),
 * or null when its invoices won't carry GST (not registered, or a client
 * outside India).
 */
export async function gstOnDocuments(
  workspaceId: string,
  client: Pick<Buyer, "state" | "country" | "gstin"> | null,
): Promise<number | null> {
  const settings = await repo.findInvoicing(workspaceId);
  return gstHints(settings, client).addsGst ? GST_RATE_PERCENT : null;
}
