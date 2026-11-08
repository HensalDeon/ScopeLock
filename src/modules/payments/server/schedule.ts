import "server-only";
import type { ObjectId } from "mongodb";
import {
  changeLabel,
  placementOf,
  type ChangeRequest,
} from "@/modules/changes";
import type { CurrencyCode } from "@/shared/lib/currency";
import { sum, type Minor } from "@/shared/lib/money";
import {
  buildSchedule,
  paymentTotals,
  type MilestoneInput,
  type Payment,
  type ScheduleItem,
} from "../domain/payment";
import { findPaymentDocs, toPayment } from "./repository";

export type ProjectForSchedule = {
  id: string;
  currency: CurrencyCode;
  milestones: MilestoneInput[];
  baseline: { total: Minor };
};

export type PaymentSchedule = {
  items: ScheduleItem[];
  payments: Payment[];
  totals: { received: Minor; due: Minor; total: Minor };
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
  const { received, due } = paymentTotals(payments);
  const total = sum(items.map((i) => i.total));
  return { items, payments, totals: { received, due, total } };
}
