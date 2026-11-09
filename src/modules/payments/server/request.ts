import "server-only";
import { ObjectId } from "mongodb";
import { changeLabel, type ChangeRequest } from "@/modules/changes";
import {
  buyerProblems,
  issueProblem,
  projectStatement,
} from "@/modules/invoices";
import { findInvoicing, issueInvoice } from "@/modules/invoices/server";
import type { ProjectWithClient } from "@/modules/projects/server";
import { withTransaction } from "@/shared/db/transaction";
import { UserError } from "@/shared/lib/form-state";
import { minor, sum, type Minor } from "@/shared/lib/money";
import type { ScheduleItem } from "../domain/payment";
import * as repo from "./repository";
import * as settingsRepo from "./settings-repository";
import { isIndia } from "@/shared/lib/india";
import { abroadPaymentProblem, payToFrom } from "../domain/methods";
import type { PaymentSchedule } from "./schedule";

class AlreadyRequested extends Error {}

/**
 * Creates the payment request and its invoice together: the invoice number,
 * the frozen invoice and the payment (with its GST) commit in one
 * transaction, or none of them do.
 */
export async function createRequest(input: {
  workspaceId: string;
  project: ProjectWithClient;
  projectId: ObjectId;
  schedule: PaymentSchedule;
  item: ScheduleItem;
  changes: readonly ChangeRequest[];
  business: { name: string; email: string | null };
  by: { userId: string; name: string };
}): Promise<{ id: string; tax: Minor; payable: Minor; invoiceNumber: string }> {
  const { workspaceId: ws, project, item, schedule } = input;
  const client = project.client;
  if (!client) {
    throw new UserError(
      "This project has no client any more, so there's no one to invoice.",
    );
  }
  const [settings, { methods }] = await Promise.all([
    findInvoicing(ws),
    settingsRepo.findMethods(ws),
  ]);
  const buyer = {
    name: client.name,
    company: client.company,
    address: client.address,
    state: client.state,
    country: client.country,
    gstin: client.gstin,
    email: client.email,
  };
  const problem =
    issueProblem(settings, buyer) ??
    abroadPaymentProblem(
      methods,
      !isIndia(buyer.country),
      client.name.trim().split(/\s+/)[0] ?? client.name,
    );
  if (problem) throw new UserError(problem);
  const missing = buyerProblems(buyer, item.total, settings);
  if (missing.length > 0) {
    throw new UserError(
      `Add ${missing.join(" and ")} to ${client.name}'s details first, then ask again.`,
    );
  }

  // The last payment on the project: its invoice shows how it all adds up.
  const final = schedule.items.every((i) => i.key === item.key || i.payment);
  const statement = final
    ? projectStatement({
        originalScope: project.baseline.total,
        changes: input.changes
          .filter((c) => c.status === "approved")
          .map((c) => ({
            label: `${changeLabel(c.number)} ${c.title}`,
            amount: c.total,
          })),
        receivedBefore: schedule.totals.received,
        awaitingBefore: schedule.totals.due,
        thisInvoice: item.total,
        // With GST, what's actually left to pay: earlier unpaid + this one.
        owedWithGst: sum([
          schedule.totals.gst?.due ?? schedule.totals.due,
          item.payable,
        ]),
      })
    : null;

  const paymentId = new ObjectId();
  try {
    const invoice = await withTransaction(async (session) => {
      const issued = await issueInvoice(
        ws,
        { projectId: input.projectId, paymentId },
        {
          settings,
          business: input.business,
          buyer,
          projectName: project.name,
          paymentLabel: item.label,
          lines: item.lines.map((l) => ({
            description: l.description,
            amount: l.amount,
          })),
          currency: project.currency,
          statement,
          payTo: payToFrom(methods, project.currency, !isIndia(buyer.country)),
        },
        session,
      );
      const id = await repo.insertPayment(
        ws,
        {
          _id: paymentId,
          projectId: input.projectId,
          key: item.key,
          label: item.label,
          lines: item.lines,
          amount: item.total,
          tax: issued.tax,
          invoice: { id: issued.id, number: issued.number },
          currency: project.currency,
          by: input.by,
        },
        session,
      );
      if (!id) throw new AlreadyRequested();
      return issued;
    });
    return {
      id: paymentId.toHexString(),
      tax: invoice.tax,
      payable: minor(item.total + invoice.tax),
      invoiceNumber: invoice.number,
    };
  } catch (error) {
    if (error instanceof AlreadyRequested) {
      throw new UserError("You've already asked for this payment.");
    }
    throw error;
  }
}
