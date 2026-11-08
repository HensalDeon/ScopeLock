"use server";

import type { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/modules/activity/server";
import { listChanges } from "@/modules/changes/server";
import {
  findProjectWithClient,
  getShareState,
  type ProjectWithClient,
} from "@/modules/projects/server";
import {
  requireWorkspaceForWrite,
  workspaceAction,
  type WorkspaceContext,
} from "@/modules/workspace/server";
import { setInvoiceStatus } from "@/modules/invoices/server";
import { parseObjectId } from "@/shared/db/ids";
import { withTransaction } from "@/shared/db/transaction";
import { sendEmail } from "@/shared/email";
import { todayInIndia } from "@/shared/lib/dates";
import { isStorageConfigured } from "@/shared/lib/env";
import { UserError, type FormState } from "@/shared/lib/form-state";
import { extensionFor } from "@/shared/lib/image-type";
import { formatMoney, minor } from "@/shared/lib/money";
import {
  deleteObject,
  keyBelongsTo,
  newStorageKey,
  putObject,
  signedDownloadUrl,
  signedUrl,
} from "@/shared/storage/r2";
import { readImageUpload } from "@/shared/storage/upload";
import {
  METHOD_FIELDS,
  methodsInputSchema,
  toMethods,
  type MethodField,
} from "../domain/methods";
import { notReceivedSchema, receiveInputSchema } from "../domain/payment";
import {
  paymentConfirmedEmail,
  paymentDueEmail,
  paymentNotReceivedEmail,
} from "./emails";
import * as repo from "./repository";
import { scheduleFor } from "./schedule";
import { createRequest } from "./request";
import { refreshPaymentTotals, sendQuietly } from "./totals";

export type PaymentFormState = FormState<string>;
export type MethodsFormState = FormState<MethodField>;

const idField = (what: string) =>
  z.string().transform((value, ctx) => {
    const id = parseObjectId(value);
    if (!id) {
      ctx.addIssue({ code: "custom", message: `This ${what} doesn't exist.` });
      return z.NEVER;
    }
    return id;
  });

/** What the client pays (amount + GST; older requests have no GST). */
const payable = (doc: repo.PaymentDoc) => minor(doc.amount + (doc.tax ?? 0));

const GONE = "This payment doesn't exist any more. Refresh the page.";
const member = ({ user }: Pick<WorkspaceContext, "user">) =>
  ({ kind: "member", userId: user.id, name: user.name }) as const;

// ── Payment methods (Settings → Payments) ──────────────────────────────────

export const updatePaymentMethods = workspaceAction(
  {
    fields: METHOD_FIELDS,
    schema: methodsInputSchema,
    roles: ["owner", "admin"],
    failureMessage: "Payment details weren't saved. Please try again.",
  },
  async (input, { workspace }) => {
    const { qrKey } = await repo.findMethods(workspace.workspaceId);
    const methods = toMethods(input, Boolean(qrKey));
    if (input.defaultMethod && !methods[input.defaultMethod]) {
      throw new UserError(
        "Fill in the method you chose as the default, or pick another.",
      );
    }
    // Keep the QR's label even while no image is uploaded.
    await repo.saveMethods(workspace.workspaceId, {
      ...methods,
      qr: { label: input.qrLabel ?? "Scan to pay" },
    });
    refresh();
    return { message: "Payment details saved." };
  },
);

export type QrResult =
  | { status: "success"; url: string | null }
  | { status: "error"; message: string };

const CAN_EDIT = new Set(["owner", "admin"]);

/** The QR image (another wallet or a merchant QR). Same checks as the logo. */
export async function uploadPaymentQr(formData: FormData): Promise<QrResult> {
  const { workspace, role } = await requireWorkspaceForWrite();
  if (!CAN_EDIT.has(role)) {
    return {
      status: "error",
      message: "Only the workspace owner or an admin can change this.",
    };
  }
  if (!isStorageConfigured()) {
    return {
      status: "error",
      message: "Image uploads aren't set up on this server yet.",
    };
  }
  const upload = await readImageUpload(formData.get("file"));
  if (!upload.ok) return { status: "error", message: upload.message };
  try {
    const key = newStorageKey(
      workspace.workspaceId,
      "payment-qr",
      extensionFor(upload.type),
    );
    await putObject(key, upload.buffer, upload.type);
    const previous = await repo.setQrKey(workspace.workspaceId, key);
    if (previous && keyBelongsTo(previous, workspace.workspaceId)) {
      await deleteObject(previous).catch(() => {});
    }
    refresh();
    return { status: "success", url: await signedUrl(key) };
  } catch (error) {
    console.error("[payments] QR upload failed", error);
    return {
      status: "error",
      message: "The QR image didn't upload. Please try again.",
    };
  }
}

export async function removePaymentQr(): Promise<QrResult> {
  const { workspace, role } = await requireWorkspaceForWrite();
  if (!CAN_EDIT.has(role)) {
    return {
      status: "error",
      message: "Only the workspace owner or an admin can change this.",
    };
  }
  const previous = await repo.setQrKey(workspace.workspaceId, null);
  if (
    previous &&
    isStorageConfigured() &&
    keyBelongsTo(previous, workspace.workspaceId)
  ) {
    await deleteObject(previous).catch(() => {});
  }
  refresh();
  return { status: "success", url: null };
}

// ── Requests and confirmations (project page) ──────────────────────────────

async function activeProject(projectId: ObjectId): Promise<ProjectWithClient> {
  const project = await findProjectWithClient(projectId.toHexString());
  if (!project) throw new UserError("This project doesn't exist any more.");
  if (project.status !== "active" && project.status !== "completed") {
    throw new UserError(
      "Payments start once your client has approved the proposal.",
    );
  }
  return project;
}

/** The client's page for a payment (or null without a working link). */
async function paymentUrl(project: ProjectWithClient, paymentId: string) {
  const { url } = await getShareState(project.id);
  return url ? `${url}/pay/${paymentId}` : null;
}

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

const byPayment = {
  fields: ["projectId", "paymentId"] as const,
  schema: z.object({
    projectId: idField("project"),
    paymentId: idField("payment"),
  }),
};

async function ownPayment(
  ws: string,
  projectId: ObjectId,
  paymentId: ObjectId,
) {
  const doc = await repo.findPaymentDoc(ws, projectId, paymentId);
  if (!doc) throw new UserError(GONE);
  return doc;
}

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
      data: { title: doc.label },
    });
    refresh();
    return {
      message: doc.invoice
        ? `Request cancelled, and invoice ${doc.invoice.number} with it. Asking again issues a new invoice.`
        : "Request cancelled. You can ask for it again.",
    };
  },
);

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
