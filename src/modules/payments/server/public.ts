import "server-only";
import type { ObjectId } from "mongodb";
import QRCode from "qrcode";
import { logActivity } from "@/modules/activity/server";
import type { ChangeRequest } from "@/modules/changes";
import { sendEmail } from "@/shared/email";
import { env, isStorageConfigured } from "@/shared/lib/env";
import { extensionFor } from "@/shared/lib/image-type";
import { formatMoney, minor } from "@/shared/lib/money";
import { deleteObject, newStorageKey, putObject } from "@/shared/storage/r2";
import { readImageUpload } from "@/shared/storage/upload";
import {
  METHOD_LABELS,
  methodsFor,
  upiLink,
  type MethodKind,
  type PaymentMethods,
} from "../domain/methods";
import type { Payment } from "../domain/payment";
import { paymentReportedEmail } from "./emails";
import { methodsWithQr } from "./queries";
import * as repo from "./repository";
import {
  scheduleFor,
  type PaymentSchedule,
  type ProjectForSchedule,
} from "./schedule";
import { refreshPaymentTotals, sendQuietly } from "./totals";

/*
 * For the public client portal only. The workspace and project always come
 * from the project found by the link's token, never from the request.
 */

/** The project's payments as the client sees them. */
export async function portalSchedule(
  workspaceId: string,
  projectId: ObjectId,
  project: ProjectForSchedule,
  changes: readonly ChangeRequest[],
): Promise<PaymentSchedule> {
  return scheduleFor(workspaceId, projectId, project, changes);
}

export type PortalPayment = {
  payment: Payment;
  methods: PaymentMethods;
  /** Methods the client can use for this currency, default first. */
  available: MethodKind[];
  qrUrl: string | null;
  /** UPI: the deep link and its QR code (inline SVG), amount filled in. */
  upi: { link: string; qrSvg: string } | null;
};

/** One payment request with everything the client needs to pay it. */
export async function portalPayment(
  workspaceId: string,
  projectId: ObjectId,
  paymentId: ObjectId,
  reference: string,
): Promise<PortalPayment | null> {
  const doc = await repo.findPaymentDoc(workspaceId, projectId, paymentId);
  if (!doc || doc.status === "cancelled") return null;
  const payment = repo.toPayment(doc);
  const { methods, qrUrl } = await methodsWithQr(workspaceId);
  const available = methodsFor(methods, payment.currency);
  let upi: PortalPayment["upi"] = null;
  if (methods.upi && available.includes("upi")) {
    const link = upiLink({
      vpa: methods.upi.vpa,
      payeeName: methods.upi.payeeName,
      amount: payment.amount,
      note: `${reference} ${payment.label}`,
    });
    const qrSvg = await QRCode.toString(link, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
    });
    upi = { link, qrSvg };
  }
  return { payment, methods, available, qrUrl, upi };
}

export type ReportResult = { ok: true } | { ok: false; message: string };

/**
 * The client's "I've paid": optional screenshot (checked by its bytes,
 * private storage), then an atomic due → client says paid. Emails the
 * freelancer.
 */
export async function reportFromPortal(input: {
  workspaceId: string;
  projectId: ObjectId;
  paymentId: ObjectId;
  report: {
    method: MethodKind;
    reference: string;
    paidOn: string;
    note: string | null;
  };
  proof: FormDataEntryValue | null;
  client: { name: string; email: string | null };
  freelancerEmail: string;
  projectName: string;
  projectUrl: string;
}): Promise<ReportResult> {
  const doc = await repo.findPaymentDoc(
    input.workspaceId,
    input.projectId,
    input.paymentId,
  );
  if (!doc || doc.status !== "due") {
    return {
      ok: false,
      message: "This payment isn't waiting for you any more. Refresh the page.",
    };
  }

  let proofKey: string | null = null;
  const hasFile = input.proof instanceof File && input.proof.size > 0;
  if (hasFile) {
    if (!isStorageConfigured()) {
      return {
        ok: false,
        message:
          "Screenshots can't be uploaded right now. Send it without one.",
      };
    }
    const upload = await readImageUpload(input.proof);
    if (!upload.ok) return { ok: false, message: upload.message };
    proofKey = newStorageKey(
      input.workspaceId,
      "payment-proof",
      extensionFor(upload.type),
    );
    await putObject(proofKey, upload.buffer, upload.type);
  }

  const saved = await repo.reportPayment(
    input.workspaceId,
    input.paymentId,
    { ...input.report, proofKey, reportedAt: new Date() },
    { kind: "client", name: input.client.name },
  );
  if (!saved) {
    if (proofKey) await deleteObject(proofKey).catch(() => {});
    return {
      ok: false,
      message: "This payment isn't waiting for you any more. Refresh the page.",
    };
  }

  await refreshPaymentTotals(input.workspaceId, input.projectId);
  const amount = formatMoney(minor(doc.amount), doc.currency);
  await logActivity(input.workspaceId, {
    projectId: input.projectId,
    type: "payment.reported",
    actor: {
      kind: "client",
      name: input.client.name,
      email: input.client.email ?? "",
    },
    data: {
      title: doc.label,
      amount: doc.amount,
      currency: doc.currency,
      comment: input.report.note,
    },
  });
  await sendQuietly(() =>
    sendEmail({
      to: input.freelancerEmail,
      ...paymentReportedEmail({
        client: input.client.name,
        project: input.projectName,
        label: doc.label,
        amount,
        method: METHOD_LABELS[input.report.method],
        reference: input.report.reference,
        paidOn: input.report.paidOn,
        url: input.projectUrl,
      }),
    }),
  );
  return { ok: true };
}

export const projectUrlFor = (projectId: string) =>
  new URL(`/projects/${projectId}`, env().APP_URL).toString();
