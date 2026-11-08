import "server-only";
import type { ObjectId } from "mongodb";
import {
  changeLabel,
  placementOf,
  type ChangeRequest,
} from "@/modules/changes";
import { findClientInWorkspace } from "@/modules/clients/server";
import { taxPreview } from "@/modules/invoices";
import { findInvoicing } from "@/modules/invoices/server";
import { parseObjectId } from "@/shared/db/ids";
import type { CurrencyCode } from "@/shared/lib/currency";
import type { Minor } from "@/shared/lib/money";
import {
  scheduleTotals,
  withGst,
  type ScheduleTotals,
  type TaxPreview,
} from "../domain/gst";
import {
  buildSchedule,
  type MilestoneInput,
  type Payment,
  type ScheduleItem,
} from "../domain/payment";
import { findPaymentDocs, toPayment } from "./repository";

export type ProjectForSchedule = {
  id: string;
  clientId: string;
  currency: CurrencyCode;
  milestones: MilestoneInput[];
  baseline: { total: Minor };
};

export type PaymentSchedule = {
  items: ScheduleItem[];
  payments: Payment[];
  totals: ScheduleTotals;
};

/**
 * A project's payments: the schedule (milestones + approved changes, with
 * any requests overlaid) and the totals. Shared by the project page, the
 * client portal and the request action, so all three agree.
 */
export async function scheduleFor(
  workspaceId: string,
  projectId: ObjectId,
  project: ProjectForSchedule,
  changes: readonly ChangeRequest[],
): Promise<PaymentSchedule> {
  const payments = (await findPaymentDocs(workspaceId, projectId)).map(
    toPayment,
  );
  const items = buildSchedule({
    milestones: project.milestones,
    baselineTotal: project.baseline.total,
    currency: project.currency,
    changes: changes
      .filter((c) => c.status === "approved")
      .map((c) => ({
        id: c.id,
        label: changeLabel(c.number),
        title: c.title,
        placement: placementOf(c, project.milestones),
      })),
    payments,
  });
  const priced = withGst(items, await gstPreview(workspaceId, project));
  return { items: priced, payments, totals: scheduleTotals(priced) };
}

/** What an invoice to this project's client would add (none if no GST). */
async function gstPreview(
  workspaceId: string,
  project: ProjectForSchedule,
): Promise<TaxPreview> {
  const clientId = parseObjectId(project.clientId);
  const [settings, client] = await Promise.all([
    findInvoicing(workspaceId),
    clientId ? findClientInWorkspace(workspaceId, clientId) : null,
  ]);
  return (amount) => taxPreview(settings, client, amount);
}
