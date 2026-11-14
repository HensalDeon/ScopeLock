import "server-only";
import { cache } from "react";
import { isIndia } from "@/shared/lib/india";
import type { Statement } from "@/modules/statement";
import { statementFrom } from "@/modules/statement/server";
import { formatMoney } from "@/shared/lib/money";
import { findClientInWorkspace } from "@/modules/clients/server";

import { documentTitle } from "@/shared/lib/document-title";
import type { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import {
  listClientHistory,
  type ActivityItem,
} from "@/modules/activity/server";
import {
  parseChangeNumber,
  type ChangeRequest,
  changeLabel,
} from "@/modules/changes";
import {
  findChangeDoc,
  findChangeDocs,
  toChange,
} from "@/modules/changes/server";
import type {
  ChangeOrderData,
  DocumentImages,
  DocumentStyle,
  ProposalDocumentData,
} from "@/modules/documents";
import {
  getDocumentImages,
  getPortalDocumentSettings,
  isBranded,
  gstChangeNote,
} from "@/modules/documents/server";
import type { Invoice } from "@/modules/invoices";
import {
  findInvoice,
  findReplacementNumber,
  documentTax,
} from "@/modules/invoices/server";
import type { Project } from "@/modules/projects";
import {
  findByPortalTokenHash,
  PORTAL_TOKEN_PATTERN,
  type PortalProject,
  type SentProposal,
} from "@/modules/projects/server";
import {
  portalPayment,
  portalSchedule,
  type PaymentSchedule,
  type PortalPayment,
} from "@/modules/payments/server";
import { parseObjectId } from "@/shared/db/ids";
import { hashToken } from "@/shared/lib/token";
import { rateLimit } from "@/shared/security/rate-limit";
import { requestInfo } from "@/shared/security/request-info";

/** Where the proposal stands, from the client's side. */
export type PortalState =
  | "awaiting" // waiting for the client's answer
  | "approved"
  | "changes-requested" // client asked for changes; freelancer is editing
  | "updating"; // freelancer withdrew it to make changes

type Opened = PortalProject & { sent: SentProposal; projectId: ObjectId };

/** Page views per IP: generous for a real client, slow for a scraper. */
const VIEW_LIMIT = { limit: 120, windowSeconds: 600 };

/**
 * Every portal page starts here. Unknown, malformed and replaced links all
 * end in the same notFound(), so the page never says which one it was.
 */
// Cached per request: a page and its title (generateMetadata) share one
// lookup, so a visit counts once against the rate limit.
const openPortal = cache(openPortalUncached);

async function openPortalUncached(token: string): Promise<Opened | "limited"> {
  if (!PORTAL_TOKEN_PATTERN.test(token)) notFound();
  const { ip } = await requestInfo();
  const { allowed } = await rateLimit(
    `portal-view:${ip ?? "unknown"}`,
    VIEW_LIMIT,
  );
  if (!allowed) return "limited";
  const found = await findByPortalTokenHash(hashToken(token));
  const projectId = found && parseObjectId(found.project.id);
  if (!found?.sent || !projectId) notFound();
  return { ...found, sent: found.sent, projectId };
}

async function look(workspaceId: string) {
  const settings = await getPortalDocumentSettings(workspaceId);
  return {
    style: settings.style,
    images: await getDocumentImages(settings),
    /** Pro/Agency: their logo, and no "Sent with ScopeLock". */
    branded: settings.branded,
  };
}

export type PortalView =
  | { state: "limited" }
  | {
      state: PortalState;
      data: ProposalDocumentData;
      style: DocumentStyle;
      images: DocumentImages;
      sentAt: Date;
      decision: Project["lastDecision"];
      /** Shared change requests (never unsent drafts), newest first. */
      changes: ChangeRequest[];
      totals: Project["totals"];
      history: ActivityItem[];
      /** The payment schedule once the proposal is approved. */
      payments: PaymentSchedule | null;
      /** Approved, but GST now differs from what the proposal showed. */
      gstNote: string | null;
      branded: boolean;
    };

async function loadPortalView(token: string): Promise<PortalView> {
  const opened = await openPortal(token);
  if (opened === "limited") return { state: "limited" };
  const { workspaceId, project, sent, projectId } = opened;
  const state = portalState(project, sent.sentAt);
  const clientId = parseObjectId(project.clientId);
  const [{ style, images, branded }, changeDocs, history, client] =
    await Promise.all([
      look(workspaceId),
      state === "approved" ? findChangeDocs(workspaceId, projectId) : [],
      listClientHistory(workspaceId, projectId, sent.data.business.name),
      state === "approved" && clientId
        ? findClientInWorkspace(workspaceId, clientId)
        : null,
    ]);
  const changes = changeDocs.map(toChange);
  const payments =
    state === "approved"
      ? await portalSchedule(workspaceId, projectId, project, changes)
      : null;
  return {
    state,
    data: sent.data,
    style,
    images,
    branded,
    sentAt: sent.sentAt,
    decision: project.lastDecision,
    changes: changes.filter((c) => c.everSent),
    totals: project.totals,
    history,
    payments,
    gstNote: client
      ? gstChangeNote({
          shown: sent.data.gstPercent,
          now: await documentTax(workspaceId, client),
          clientName: sent.data.client?.name ?? client.name,
          agreed: formatMoney(sent.data.total, sent.data.currency),
        })
      : null,
  };
}

function portalState(project: Project, sentAt: Date): PortalState {
  if (project.status === "awaiting_approval") return "awaiting";
  if (project.status === "draft") {
    const answeredThisVersion =
      project.lastDecision?.decision === "rejected" &&
      project.lastDecision.at >= sentAt;
    return answeredThisVersion ? "changes-requested" : "updating";
  }
  return "approved";
}

export type PortalChangeView =
  | { state: "limited" }
  | {
      state: "ok";
      change: ChangeRequest;
      /** Null while the freelancer has it back as a draft. */
      data: ChangeOrderData | null;
      style: DocumentStyle;
      images: DocumentImages;
      branded: boolean;
      businessName: string;
      projectTitle: string;
    };

/** One change request on the portal: /c/[token]/changes/[number]. */
async function loadPortalChange(
  token: string,
  numberParam: string,
): Promise<PortalChangeView> {
  const opened = await openPortal(token);
  if (opened === "limited") return { state: "limited" };
  const number = parseChangeNumber(numberParam);
  if (!number) notFound();
  const doc = await findChangeDoc(opened.workspaceId, opened.projectId, number);
  // Drafts the client never saw don't exist as far as the portal goes.
  if (!doc?.everSent) notFound();
  return {
    state: "ok",
    change: toChange(doc),
    data: doc.status === "draft" ? null : (doc.sent?.data ?? null),
    ...(await look(opened.workspaceId)),
    businessName: opened.sent.data.business.name,
    projectTitle: opened.sent.data.title,
  };
}

export type PortalPaymentView =
  | { state: "limited" }
  | ({
      state: "ok";
      businessName: string;
      projectTitle: string;
      reference: string;
      /** Its invoice is an export: no GST, zero-rated under LUT. */
      isExport: boolean;
      branded: boolean;
    } & PortalPayment);

/** One payment request on the portal: /c/[token]/pay/[id]. */
async function loadPortalPayment(
  token: string,
  paymentIdParam: string,
): Promise<PortalPaymentView> {
  const opened = await openPortal(token);
  if (opened === "limited") return { state: "limited" };
  const id = parseObjectId(paymentIdParam);
  if (!id) notFound();
  const found = await portalPayment(
    opened.workspaceId,
    opened.projectId,
    id,
    opened.sent.data.reference,
  );
  if (!found) notFound();
  const invoiceId = found.payment.invoice
    ? parseObjectId(found.payment.invoice.id)
    : null;
  const invoice = invoiceId
    ? await findInvoice(opened.workspaceId, invoiceId, opened.projectId)
    : null;
  // UPI and QR are Indian rails: a client abroad (as they are now, even on
  // an invoice issued before they moved) gets bank or link only.
  const clientId = parseObjectId(opened.project.clientId);
  const client = clientId
    ? await findClientInWorkspace(opened.workspaceId, clientId)
    : null;
  const abroad = client
    ? !isIndia(client.country)
    : Boolean(invoice && !isIndia(invoice.buyer.country));
  const payable = abroad
    ? {
        ...found,
        available: found.available.filter((m) => m !== "upi" && m !== "qr"),
        upi: null,
      }
    : found;
  return {
    state: "ok",
    branded: await isBranded(opened.workspaceId),
    isExport: invoice?.tax.kind === "export",
    businessName: opened.sent.data.business.name,
    projectTitle: opened.sent.data.title,
    reference: opened.sent.data.reference,
    ...payable,
  };
}

export type PortalInvoiceView =
  | { state: "limited" }
  | {
      state: "ok";
      invoice: Invoice;
      /** A cancelled invoice: the one issued in its place. */
      replacedBy: string | null;
      projectTitle: string;
      logoUrl: string | null;
      accent: string;
      branded: boolean;
    };

/** An invoice on the portal: /c/[token]/invoice/[id], this project's only. */
async function loadPortalInvoice(
  token: string,
  invoiceIdParam: string,
): Promise<PortalInvoiceView> {
  const opened = await openPortal(token);
  if (opened === "limited") return { state: "limited" };
  const id = parseObjectId(invoiceIdParam);
  if (!id) notFound();
  const [invoice, { style, images, branded }] = await Promise.all([
    findInvoice(opened.workspaceId, id, opened.projectId),
    look(opened.workspaceId),
  ]);
  if (!invoice) notFound();
  return {
    state: "ok",
    invoice,
    replacedBy: await findReplacementNumber(opened.workspaceId, invoice),
    projectTitle: opened.sent.data.title,
    logoUrl: style.showLogo ? images.logoUrl : null,
    accent: style.accent,
    branded,
  };
}

export const getPortalView = cache(loadPortalView);

export const getPortalChange = cache(loadPortalChange);

export const getPortalPayment = cache(loadPortalPayment);

export const getPortalInvoice = cache(loadPortalInvoice);

/**
 * The title for a portal page, which the browser also uses as the saved
 * PDF's file name ("Proposal P-007 · Asha Designs"). Shares the page's
 * cached lookup. Null when the link is rate limited (the page says so).
 */
export async function portalTitle(
  token: string,
  page:
    | { kind: "proposal" }
    | { kind: "change"; number: string }
    | { kind: "invoice"; invoiceId: string }
    | { kind: "statement" }
    | { kind: "payment"; paymentId: string },
): Promise<string | null> {
  if (page.kind === "payment") {
    const view = await getPortalPayment(token, page.paymentId);
    return view.state === "limited"
      ? null
      : documentTitle(
          `${view.payment.label} payment ${formatMoney(view.payment.payable, view.payment.currency)}`,
          view.businessName,
        );
  }
  if (page.kind === "statement") {
    const view = await getPortalStatement(token);
    return view.state === "limited"
      ? null
      : documentTitle(
          `Project statement ${view.statement.reference}`,
          view.statement.projectTitle,
          view.statement.business.name,
        );
  }
  if (page.kind === "proposal") {
    const view = await getPortalView(token);
    return view.state === "limited"
      ? null
      : documentTitle(
          `Proposal ${view.data.reference}`,
          view.data.title,
          view.data.business.name,
        );
  }
  if (page.kind === "change") {
    const view = await getPortalChange(token, page.number);
    return view.state === "limited"
      ? null
      : documentTitle(
          `${changeLabel(view.change.number)} ${view.change.title}`,
          view.businessName,
        );
  }
  const view = await getPortalInvoice(token, page.invoiceId);
  return view.state === "limited"
    ? null
    : documentTitle(
        `${view.invoice.title} ${view.invoice.number}`,
        view.invoice.seller.company ?? view.invoice.seller.name,
      );
}

export type PortalStatementView =
  | { state: "limited" }
  | { state: "ok"; statement: Statement; accent: string; branded: boolean };

/** The project statement on the portal: /c/[token]/statement. */
async function loadPortalStatement(
  token: string,
): Promise<PortalStatementView> {
  const view = await getPortalView(token);
  if (view.state === "limited") return { state: "limited" };
  return {
    state: "ok",
    statement: statementFrom({
      data: view.data,
      approval: view.decision,
      changes: view.changes,
      items: view.payments?.items ?? [],
      requests: view.payments?.payments ?? [],
      asOf: new Date(),
    }),
    accent: view.style.accent,
    branded: view.branded,
  };
}

export const getPortalStatement = cache(loadPortalStatement);
