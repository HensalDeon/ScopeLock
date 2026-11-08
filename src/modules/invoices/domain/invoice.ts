import { z } from "zod";
import {
  gstinState,
  isGstinFormat,
  isIndia,
  STATE_CODES,
  stateName,
  type StateCode,
} from "@/shared/lib/india";
import { minor, percentOf, sum, type Minor } from "@/shared/lib/money";

/**
 * Invoices under India's GST rules (CGST Rule 46). Every payment request
 * gets one. With a GSTIN it's a "Tax invoice" with GST; without one it's a
 * plain "Invoice" (an unregistered freelancer can't charge GST). Exports
 * (clients outside India) are zero-rated under a Letter of Undertaking.
 *
 * Wording and rules were checked against the Rule 46 text; a CA should
 * review the format once before launch.
 */

/** GST on IT design and development services (SAC 998314). */
export const GST_RATE_PERCENT = 18;
export const DEFAULT_SAC = "998314";

/** Rule 46 export endorsement (current wording, as amended). */
export const LUT_ENDORSEMENT =
  "SUPPLY MEANT FOR EXPORT/SUPPLY TO SEZ UNIT OR SEZ DEVELOPER FOR AUTHORISED OPERATIONS UNDER BOND OR LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX";

/** Rule 46(e): an unregistered client's details are required from this value up. */
export const UNREGISTERED_DETAILS_FROM: Minor = minor(50_000_00);

// ── Settings → Invoicing ───────────────────────────────────────────────────

export type InvoicingSettings = {
  legalName: string | null;
  address: string | null;
  state: StateCode | null;
  gstin: string | null;
  sac: string;
  prefix: string;
  /** The first number to use this financial year (for people switching over). */
  startNumber: number;
  /** ARN of the Letter of Undertaking (RFD-11) for exports. */
  lutArn: string | null;
};

export const DEFAULT_INVOICING: InvoicingSettings = {
  legalName: null,
  address: null,
  state: null,
  gstin: null,
  sac: DEFAULT_SAC,
  prefix: "INV",
  startNumber: 1,
  lutArn: null,
};

export const INVOICING_FIELDS = [
  "legalName",
  "address",
  "state",
  "gstin",
  "sac",
  "prefix",
  "startNumber",
  "lutArn",
] as const;
export type InvoicingField = (typeof INVOICING_FIELDS)[number];

const optional = (max: number, what: string) =>
  z
    .string()
    .trim()
    .max(max, `Keep the ${what} under ${max} characters.`)
    .transform((v) => v || null);

export const invoicingInputSchema = z
  .object({
    legalName: optional(120, "legal name"),
    address: optional(300, "address"),
    state: z
      .union([z.enum(STATE_CODES), z.literal("")])
      .transform((v) => (v || null) as StateCode | null),
    gstin: optional(15, "GSTIN").transform((v) => v?.toUpperCase() ?? null),
    sac: z
      .string()
      .trim()
      .regex(/^\d{4,8}$/, "A SAC code is 4 to 8 digits, like 998314."),
    prefix: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^[A-Z0-9-]{1,5}$/,
        "Use up to 5 letters, digits or hyphens, like INV.",
      ),
    startNumber: z.coerce
      .number({ message: "Use a whole number, like 1." })
      .int("Use a whole number, like 1.")
      .min(1, "Start from 1 or more.")
      .max(9999, "Keep it under 10,000."),
    lutArn: optional(20, "LUT ARN").transform((v) => v?.toUpperCase() ?? null),
  })
  .superRefine((v, ctx) => {
    const issue = (path: InvoicingField, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (v.gstin) {
      if (!isGstinFormat(v.gstin)) {
        issue(
          "gstin",
          "That doesn't look like a GSTIN. It's 15 characters, like 32ABCDE1234F1Z5.",
        );
      } else if (v.state && gstinState(v.gstin) !== v.state) {
        issue(
          "state",
          `Your GSTIN is registered in ${stateName(v.gstin.slice(0, 2))}. Choose that state.`,
        );
      }
      // A tax invoice needs the supplier's name and address (Rule 46(a)).
      if (!v.legalName)
        issue(
          "legalName",
          "Add the legal name your GSTIN is registered under.",
        );
      if (!v.address)
        issue(
          "address",
          "Add your registered address. It's required on a tax invoice.",
        );
    }
    if (v.lutArn && !/^[A-Z0-9]{8,20}$/.test(v.lutArn)) {
      issue(
        "lutArn",
        "Use the ARN from your LUT acknowledgement, letters and digits only.",
      );
    }
  });

export type InvoicingInput = z.output<typeof invoicingInputSchema>;

/** Stored settings, with the state taken from the GSTIN when it has one. */
export function toInvoicingSettings(input: InvoicingInput): InvoicingSettings {
  return {
    ...input,
    state: input.gstin ? (gstinState(input.gstin) ?? input.state) : input.state,
  };
}

export function invoicingFormValues(
  s: InvoicingSettings,
): Record<InvoicingField, string> {
  return {
    legalName: s.legalName ?? "",
    address: s.address ?? "",
    state: s.state ?? "",
    gstin: s.gstin ?? "",
    sac: s.sac,
    prefix: s.prefix,
    startNumber: String(s.startNumber),
    lutArn: s.lutArn ?? "",
  };
}

// ── Numbers ────────────────────────────────────────────────────────────────

/**
 * "INV/26-27/001": prefix, financial year, serial. Rule 46(b): at most 16
 * characters (letters, digits, "-" and "/"), unique for a financial year.
 */
export function invoiceNumber(
  prefix: string,
  fyShort: string,
  serial: number,
): string {
  const number = `${prefix}/${fyShort}/${String(serial).padStart(3, "0")}`;
  if (number.length > 16 || !/^[A-Z0-9/-]+$/.test(number)) {
    throw new RangeError(
      `Invoice number ${number} breaks the 16-character rule`,
    );
  }
  return number;
}

// ── Tax ────────────────────────────────────────────────────────────────────

export type Buyer = {
  name: string;
  company: string | null;
  address: string | null;
  /** Indian state code, when in India. */
  state: StateCode | null;
  /** Null or "India" for Indian clients. */
  country: string | null;
  gstin: string | null;
};

export type InvoiceTax =
  | { kind: "none" }
  | {
      kind: "intra";
      placeOfSupply: StateCode;
      cgst: Minor;
      sgst: Minor;
    }
  | { kind: "inter"; placeOfSupply: StateCode; igst: Minor }
  | { kind: "export"; country: string };

/**
 * GST for one invoice (IGST Act s.12(2) for clients in India):
 * - no GSTIN on your side → no GST;
 * - client outside India → export, zero-rated under LUT;
 * - place of supply: the client's GSTIN state, else the state on their
 *   address, else (no address on record) your own state;
 * - same state as yours → CGST 9% + SGST 9%, otherwise IGST 18%.
 */
export function invoiceTax(input: {
  seller: Pick<InvoicingSettings, "gstin" | "state">;
  buyer: Pick<Buyer, "state" | "country" | "gstin">;
  taxable: Minor;
}): InvoiceTax {
  const { seller, buyer, taxable } = input;
  if (!seller.gstin || !seller.state) return { kind: "none" };
  if (!isIndia(buyer.country))
    return { kind: "export", country: buyer.country ?? "" };
  const place =
    (buyer.gstin && gstinState(buyer.gstin)) || buyer.state || seller.state;
  if (place === seller.state) {
    const half = GST_RATE_PERCENT / 2;
    return {
      kind: "intra",
      placeOfSupply: place,
      cgst: percentOf(taxable, half),
      sgst: percentOf(taxable, half),
    };
  }
  return {
    kind: "inter",
    placeOfSupply: place,
    igst: percentOf(taxable, GST_RATE_PERCENT),
  };
}

export function taxTotal(tax: InvoiceTax): Minor {
  if (tax.kind === "intra") return sum([tax.cgst, tax.sgst]);
  if (tax.kind === "inter") return tax.igst;
  return minor(0);
}

/** What's missing before an invoice for this client can be issued. */
export function buyerProblems(
  buyer: Buyer,
  total: Minor,
  seller: Pick<InvoicingSettings, "gstin">,
): string[] {
  const problems: string[] = [];
  if (!seller.gstin) return problems; // a plain invoice has no such rules
  if (!isIndia(buyer.country)) {
    if (!buyer.address)
      problems.push("their address (needed on an export invoice)");
    return problems;
  }
  if (
    !buyer.gstin &&
    total >= UNREGISTERED_DETAILS_FROM &&
    (!buyer.address || !buyer.state)
  ) {
    problems.push(
      "their address and state (needed on invoices of ₹50,000 or more)",
    );
  }
  return problems;
}
