"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/modules/activity/server";
import { listChanges } from "@/modules/changes/server";
import { workspaceAction } from "@/modules/workspace/server";
import { setInvoiceStatus } from "@/modules/invoices/server";
import { withTransaction } from "@/shared/db/transaction";
import { sendEmail } from "@/shared/email";
import { UserError, type FormState } from "@/shared/lib/form-state";
import { formatMoney } from "@/shared/lib/money";
import { paymentDueEmail } from "./emails";
import * as repo from "./repository";
import { scheduleFor } from "./schedule";
import { createRequest } from "./request";
import { refreshPaymentTotals, sendQuietly } from "./totals";
import {
  activeProject,
  byPayment,
  idField,
  member,
  ownPayment,
  paymentUrl,
} from "./action-helpers";

export type PaymentFormState = FormState<string>;

// ── Requests and confirmations (project page) ──────────────────────────────

export const requestPayment = workspaceAction(
  {
    fields: ["projectId", "key"],
    schema: z.object({
      projectId: idField("project"),
      key: z.string().min(1).max(40),
    }),
    failureMessage: "The payment wasn't requested. Please try again.",
  },
  async ({ projectId, key }, context) => {
    const ws = context.workspace.workspaceId;
    const project = await activeProject(projectId);
    const changes = await listChanges(project.id);
    const schedule = await scheduleFor(ws, projectId, project, changes);
    const item = schedule.items.find((i) => i.key === key);
    if (!item)
      throw new UserError(
        "That payment isn't on this project any more. Refresh the page.",
      );
    if (item.payment)
      throw new UserError("You've already asked for this payment.");
    if (item.total <= 0)
      throw new UserError("There's nothing to ask for on this payment.");

    const { id, tax, payable, invoiceNumber } = await createRequest({
      workspaceId: ws,
      project,
      projectId,
      schedule,
      item,
      changes,
      business: {
        name: context.workspace.businessName,
        email: context.user.email,
      },
      by: { userId: context.user.id, name: context.user.name },
    });
    await refreshPaymentTotals(ws, projectId);
    const amount = formatMoney(payable, project.currency);
    await logActivity(ws, {
      projectId,
      type: "payment.requested",
      actor: member(context),
      data: {
        title: item.label,
        label: invoiceNumber,
        amount: payable,
        currency: project.currency,
      },
    });
    const url = await paymentUrl(project, id);
    if (project.client?.email && url) {
      await sendQuietly(() =>
        sendEmail({
          to: project.client?.email ?? "",
          ...paymentDueEmail({
            business: context.workspace.businessName,
            project: project.name,
            label: item.label,
            amount,
            lines: [
              ...item.lines.map(
                (l) =>
                  `${l.description}: ${formatMoney(l.amount, project.currency)}`,
              ),
              ...(tax > 0
                ? [`GST: ${formatMoney(tax, project.currency)}`]
                : []),
            ],
            invoiceNumber,
            url,
          }),
        }),
      );
    }
    refresh();
    return {
      message: project.client?.email
        ? `Asked for ${amount}. ${project.client.name} has been emailed; you can also send the link on WhatsApp.`
        : `Asked for ${amount}. Send the link to your client on WhatsApp.`,
      id,
    };
  },
);

export const cancelPaymentRequest = workspaceAction(
  { ...byPayment, failureMessage: "It wasn't cancelled. Please try again." },
  async ({ projectId, paymentId }, context) => {
    const ws = context.workspace.workspaceId;
    const doc = await ownPayment(ws, projectId, paymentId);
    // The payment and its invoice change together.
    const cancelled = await withTransaction(async (session) => {
      const ok = await repo.cancelPayment(
        ws,
        paymentId,
        { kind: "member", name: context.user.name },
        session,
      );
      if (ok) await setInvoiceStatus(ws, paymentId, "cancelled", session);
      return ok;
    });
    if (!cancelled) {
      throw new UserError(
        "This payment has already been received, so it can't be cancelled.",
      );
    }
    await refreshPaymentTotals(ws, projectId);
    await logActivity(ws, {
      projectId,
      type: "payment.cancelled",
      actor: member(context),
      data: { title: doc.label, label: doc.invoice?.number },
    });
    refresh();
    return {
      message: doc.invoice
        ? `Request cancelled, and invoice ${doc.invoice.number} with it. Asking again issues a new invoice.`
        : "Request cancelled. You can ask for it again.",
    };
  },
);
