import "server-only";
import type { ChangeRequest } from "@/modules/changes";
import { gstHints, taxCaseOf } from "@/modules/invoices";
import { findInvoicing } from "@/modules/invoices/server";
import { requireWorkspace } from "@/modules/workspace/server";
import { hasAnyMethod } from "../domain/methods";
import { getProjectPayments } from "./queries";
import type { PaymentSchedule, ProjectForSchedule } from "./schedule";
import * as settingsRepo from "./settings-repository";

export type ProjectMoney = PaymentSchedule & {
  /** False until at least one payment method is set up. */
  methodsReady: boolean;
  /** Invoice details saved (legal name, address or GSTIN). */
  invoicingReady: boolean;
  /** GST applies but the client has no state or GSTIN on record. */
  stateFallback: { yourState: string; clientHref: string } | null;
  /**
   * The client is abroad (zero-rated export) but the project is in rupees:
   * GST law counts it as an export only if paid in foreign exchange (or INR
   * through an RBI-permitted route), IGST Act s.2(6).
   */
  exportCheck: { clientHref: string } | null;
  /** The client is outside India: their invoices are exports, no GST. */
  exportClient: boolean;
  /** When this was read (for "asked 3 days ago" style decisions). */
  now: Date;
};

/** Everything the project page shows about money, for an approved project. */
export async function getProjectMoney(
  project: ProjectForSchedule,
  client: {
    id: string;
    state: string | null;
    country: string | null;
    gstin: string | null;
  } | null,
  changes: readonly ChangeRequest[],
): Promise<ProjectMoney> {
  const { workspace } = await requireWorkspace();
  const ws = workspace.workspaceId;
  const [schedule, { methods }, settings] = await Promise.all([
    getProjectPayments(project, changes),
    settingsRepo.findMethods(ws),
    findInvoicing(ws),
  ]);
  const gst = gstHints(settings, client as Parameters<typeof gstHints>[1]);
  return {
    ...schedule,
    methodsReady: hasAnyMethod(methods),
    exportClient:
      taxCaseOf(settings, client as Parameters<typeof taxCaseOf>[1]) ===
      "export",
    invoicingReady: Boolean(
      settings.legalName || settings.address || settings.gstin,
    ),
    now: new Date(),
    stateFallback:
      gst.fallbackState && client
        ? {
            yourState: gst.fallbackState,
            clientHref: `/clients/${client.id}#billing`,
          }
        : null,
    exportCheck:
      client &&
      project.currency === "INR" &&
      taxCaseOf(settings, client as Parameters<typeof taxCaseOf>[1]) ===
        "export"
        ? { clientHref: `/clients/${client.id}#billing` }
        : null,
  };
}
