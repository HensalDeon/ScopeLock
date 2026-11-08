"use server";

import type { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/modules/activity/server";
import {
  findProjectWithClient,
  getShareState,
} from "@/modules/projects/server";
import {
  workspaceAction,
  type WorkspaceContext,
} from "@/modules/workspace/server";
import { setInvoiceStatus } from "@/modules/invoices/server";
import { requireWorkspaceForWrite } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import { withTransaction } from "@/shared/db/transaction";
import { sendEmail } from "@/shared/email";
import { todayInIndia } from "@/shared/lib/dates";
import { UserError } from "@/shared/lib/form-state";
import { isStorageConfigured } from "@/shared/lib/env";
import { formatMoney } from "@/shared/lib/money";
import { keyBelongsTo, signedDownloadUrl } from "@/shared/storage/r2";
import { notReceivedSchema, receiveInputSchema } from "../domain/payment-forms";
import { paymentConfirmedEmail, paymentNotReceivedEmail } from "./emails";
import * as repo from "./repository";
import { refreshPaymentTotals, sendQuietly } from "./totals";
import {
  byPayment,
  idField,
  member,
  ownPayment,
  payable,
  paymentUrl,
} from "./action-helpers";

// ── Confirmations (project page) ───────────────────────────────────────────

async function confirmed(
  context: WorkspaceContext,
  projectId: ObjectId,
  doc: repo.PaymentDoc,
  confirmation: NonNullable<repo.PaymentDoc["confirmation"]>,
) {
  const ws = context.workspace.workspaceId;
  const done = await withTransaction(async (session) => {
    const ok = await repo.confirmPayment(ws, doc._id, confirmation, session);
    if (ok) await setInvoiceStatus(ws, doc._id, "paid", session);
    return ok;
  });
  if (!done) {
    throw new UserError(
      "This payment was already received or cancelled. Refresh the page.",
    );
  }
  await refreshPaymentTotals(ws, projectId);
  await logActivity(ws, {
    projectId,
    type: "payment.confirmed",
    actor: member(context),
    data: { title: doc.label, amount: payable(doc), currency: doc.currency },
  });
  const project = await findProjectWithClient(projectId.toHexString());
  const portal = project ? (await getShareState(project.id)).url : null;
  if (project?.client?.email && portal) {
    await sendQuietly(() =>
      sendEmail({
        to: project.client?.email ?? "",
        ...paymentConfirmedEmail({
          business: context.workspace.businessName,
          project: project.name,
          label: doc.label,
          amount: formatMoney(payable(doc), doc.currency),
          url: portal,
        }),
      }),
    );
  }
  refresh();
}

/** The client's "I've paid" checks out. */
export const confirmReportedPayment = workspaceAction(
  { ...byPayment, failureMessage: "It wasn't confirmed. Please try again." },
  async ({ projectId, paymentId }, context) => {
    const doc = await ownPayment(
      context.workspace.workspaceId,
      projectId,
      paymentId,
    );
    if (doc.status !== "client_reported" || !doc.report) {
      throw new UserError(
        "Your client hasn't said they've paid this one. Use “Mark as received” instead.",
      );
    }
    await confirmed(context, projectId, doc, {
      method: doc.report.method,
      reference: doc.report.reference,
      receivedOn: doc.report.paidOn,
      confirmedAt: new Date(),
      by: { userId: context.user.id, name: context.user.name },
    });
    return {
      message: `Marked ${formatMoney(payable(doc), doc.currency)} as received.`,
    };
  },
);

/** Paid without the client reporting it (cash, a transfer they didn't log). */
export const markPaymentReceived = workspaceAction(
  {
    fields: ["projectId", "paymentId", "method", "reference", "receivedOn"],
    schema: z
      .object({ projectId: idField("project"), paymentId: idField("payment") })
      .and(receiveInputSchema(todayInIndia())),
    failureMessage: "It wasn't saved. Please try again.",
  },
  async ({ projectId, paymentId, method, reference, receivedOn }, context) => {
    const doc = await ownPayment(
      context.workspace.workspaceId,
      projectId,
      paymentId,
    );
    await confirmed(context, projectId, doc, {
      method,
      reference,
      receivedOn,
      confirmedAt: new Date(),
      by: { userId: context.user.id, name: context.user.name },
    });
    return {
      message: `Marked ${formatMoney(payable(doc), doc.currency)} as received.`,
    };
  },
);

export const markNotReceived = workspaceAction(
  {
    fields: ["projectId", "paymentId", "note"],
    schema: z
      .object({ projectId: idField("project"), paymentId: idField("payment") })
      .and(notReceivedSchema),
    failureMessage: "It wasn't saved. Please try again.",
  },
  async ({ projectId, paymentId, note }, context) => {
    const ws = context.workspace.workspaceId;
    const doc = await ownPayment(ws, projectId, paymentId);
    if (
      !(await repo.rejectReport(ws, paymentId, note, {
        kind: "member",
        name: context.user.name,
      }))
    ) {
      throw new UserError(
        "This payment isn't waiting for your check any more. Refresh the page.",
      );
    }
    await refreshPaymentTotals(ws, projectId);
    await logActivity(ws, {
      projectId,
      type: "payment.not_received",
      actor: member(context),
      data: { title: doc.label, comment: note },
    });
    const project = await findProjectWithClient(projectId.toHexString());
    const url = project
      ? await paymentUrl(project, paymentId.toHexString())
      : null;
    if (project?.client?.email && url) {
      await sendQuietly(() =>
        sendEmail({
          to: project.client?.email ?? "",
          ...paymentNotReceivedEmail({
            business: context.workspace.businessName,
            project: project.name,
            label: doc.label,
            amount: formatMoney(payable(doc), doc.currency),
            note,
            url,
          }),
        }),
      );
    }
    refresh();
    return { message: "Your client can see your note on the payment page." };
  },
);

/** A 10-minute download link for the client's screenshot. */
export async function paymentProofUrl(
  paymentId: string,
): Promise<{ url: string } | { error: string }> {
  const { workspace } = await requireWorkspaceForWrite();
  const id = parseObjectId(paymentId);
  const key = id ? await repo.findProofKey(workspace.workspaceId, id) : null;
  if (
    !key ||
    !keyBelongsTo(key, workspace.workspaceId) ||
    !isStorageConfigured()
  ) {
    return { error: "There's no screenshot for this payment." };
  }
  const ext = key.split(".").pop() ?? "png";
  return { url: await signedDownloadUrl(key, `payment-proof.${ext}`) };
}
