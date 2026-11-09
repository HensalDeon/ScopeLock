import type { CurrencyCode } from "@/shared/lib/currency";
import { isIndia, stateName, type StateCode } from "@/shared/lib/india";
import { minor, sum, type Minor } from "@/shared/lib/money";
import {
  LUT_ENDORSEMENT,
  invoiceTax,
  taxTotal,
  type Buyer,
  type InvoiceTax,
  type InvoicingSettings,
} from "./invoice";

/**
 * What an invoice says, frozen when it's issued. Later edits to the
 * client, the settings or the project never change an issued invoice
 * (Rule 46: a tax invoice is a fixed record).
 */

export type ProjectStatement = {
  originalScope: Minor;
  changes: { label: string; amount: Minor }[];
  projectTotal: Minor;
  /** Received before this invoice (taxable values). */
  receivedBefore: Minor;
  /** Asked for on earlier invoices and not paid yet. */
  awaitingBefore: Minor;
  thisInvoice: Minor;
  /** Left after this invoice and the earlier ones are paid. */
  balanceAfter: Minor;
};

export function projectStatement(input: {
  originalScope: Minor;
  changes: { label: string; amount: Minor }[];
  receivedBefore: Minor;
  awaitingBefore: Minor;
  thisInvoice: Minor;
}): ProjectStatement {
  const projectTotal = sum([
    input.originalScope,
    ...input.changes.map((c) => c.amount),
  ]);
  return {
    ...input,
    projectTotal,
    balanceAfter: minor(
      projectTotal -
        input.receivedBefore -
        input.awaitingBefore -
        input.thisInvoice,
    ),
  };
}

export type InvoiceParty = {
  name: string;
  company: string | null;
  address: string | null;
  /** "Kerala (32)", for Indian parties with a state. */
  state: string | null;
  country: string | null;
  gstin: string | null;
  email: string | null;
};

export type InvoiceLine = { description: string; sac: string; amount: Minor };

export type InvoiceSnapshot = {
  /** "Tax invoice" with a GSTIN, "Invoice" without. */
  title: "Tax invoice" | "Invoice";
  number: string;
  /** YYYY-MM-DD, India time. */
  issuedOn: string;
  seller: InvoiceParty;
  buyer: InvoiceParty;
  projectName: string;
  /** "Design approved", "CR-002 Blog section". */
  paymentLabel: string;
  lines: InvoiceLine[];
  currency: CurrencyCode;
  subtotal: Minor;
  tax: InvoiceTax;
  total: Minor;
  /** "Maharashtra (27)" on tax invoices within India. */
  placeOfSupply: string | null;
  /** Tax invoices only: GST isn't payable by the client (reverse charge). */
  reverseCharge: boolean | null;
  export: { country: string; lutArn: string; endorsement: string } | null;
  /** On the final invoice: the whole project, so the client sees it adds up. */
  statement: ProjectStatement | null;
  /**
   * How to pay, as set up when the invoice was issued (frozen with it, so a
   * later change in settings never alters an old invoice). Missing on
   * invoices issued before it existed.
   */
  payTo?: InvoicePayTo | null;
};

export type InvoicePayTo = {
  upi: { vpa: string; payeeName: string } | null;
  bank: {
    accountName: string;
    accountNumber: string;
    ifsc: string | null;
    bankName: string;
    swift: string | null;
    iban: string | null;
  } | null;
  link: { label: string; url: string } | null;
};

const stateLabel = (code: StateCode | null) =>
  code ? `${stateName(code)} (${code})` : null;

/** Why this invoice can't be issued yet (for the freelancer to fix). */
export function issueProblem(
  settings: Pick<InvoicingSettings, "gstin" | "lutArn">,
  buyer: Pick<Buyer, "country">,
): string | null {
  if (settings.gstin && !isIndia(buyer.country) && !settings.lutArn) {
    return "This client is outside India, so the invoice needs your LUT ARN. Add it in Settings → Invoicing, then ask again.";
  }
  return null;
}

export function buildInvoice(input: {
  settings: InvoicingSettings;
  business: { name: string; email: string | null };
  buyer: Buyer & { email: string | null };
  number: string;
  issuedOn: string;
  projectName: string;
  paymentLabel: string;
  lines: { description: string; amount: Minor }[];
  currency: CurrencyCode;
  statement: ProjectStatement | null;
  payTo?: InvoicePayTo | null;
}): InvoiceSnapshot {
  const { settings, buyer } = input;
  const registered = Boolean(settings.gstin && settings.state);
  const subtotal = sum(input.lines.map((l) => l.amount));
  const tax = invoiceTax({ seller: settings, buyer, taxable: subtotal });
  const abroad = !isIndia(buyer.country);
  return {
    title: registered ? "Tax invoice" : "Invoice",
    number: input.number,
    issuedOn: input.issuedOn,
    seller: {
      name: settings.legalName ?? input.business.name,
      // The trade name clients know ("Asha Designs") above the legal name.
      company:
        settings.legalName && settings.legalName !== input.business.name
          ? input.business.name
          : null,
      address: settings.address,
      state: stateLabel(settings.state),
      country: null,
      gstin: settings.gstin,
      email: input.business.email,
    },
    buyer: {
      name: buyer.name,
      company: buyer.company,
      address: buyer.address,
      state: abroad ? null : stateLabel(buyer.state),
      country: abroad ? buyer.country : null,
      gstin: abroad ? null : buyer.gstin,
      email: buyer.email,
    },
    projectName: input.projectName,
    paymentLabel: input.paymentLabel,
    lines: input.lines.map((l) => ({ ...l, sac: settings.sac })),
    currency: input.currency,
    subtotal,
    tax,
    total: sum([subtotal, taxTotal(tax)]),
    placeOfSupply:
      tax.kind === "intra" || tax.kind === "inter"
        ? stateLabel(tax.placeOfSupply)
        : null,
    reverseCharge: registered ? false : null,
    export:
      tax.kind === "export" && settings.lutArn
        ? {
            country: tax.country,
            lutArn: settings.lutArn,
            endorsement: LUT_ENDORSEMENT,
          }
        : null,
    statement: input.statement,
    payTo: input.payTo ?? null,
  };
}

export type InvoiceStatus = "issued" | "paid" | "cancelled";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  issued: "Unpaid",
  paid: "Paid",
  cancelled: "Cancelled",
};

export type Invoice = InvoiceSnapshot & {
  id: string;
  projectId: string;
  paymentId: string;
  status: InvoiceStatus;
  issuedAt: Date;
  /** sha256 of the snapshot as issued, to show it hasn't changed. */
  snapshotHash: string;
};

/**
 * A line as the invoice prints it. Milestone lines are stored as "30% of
 * the agreed ₹80,000", which doesn't say what was bought (Rule 46 wants a
 * description of the service), so they're named after the project and the
 * payment: "Website redesign, Design approved (30% of the agreed ₹80,000)".
 * Change request lines ("CR-001 Blog section") already say it.
 */
export function lineDescription(
  description: string,
  invoice: Pick<InvoiceSnapshot, "projectName" | "paymentLabel">,
): string {
  return /^\d+(\.\d+)?% of the agreed /.test(description)
    ? `${invoice.projectName}, ${invoice.paymentLabel} (${description})`
    : description;
}
