import { isIndia, stateName } from "@/shared/lib/india";
import { minor, sum, type Minor } from "@/shared/lib/money";
import {
  GST_RATE_PERCENT,
  invoiceTax,
  taxTotal,
  type Buyer,
  type InvoicingSettings,
} from "./invoice";

/** GST shown before an invoice exists, using the invoice's own rule. */

/**
 * For the project page, before a payment is asked for: will its invoice
 * carry GST, and is the client's state missing (so the invoice falls back
 * to yours, IGST Act s.12(2)(b), and charges CGST + SGST)?
 */
export function gstHints(
  seller: Pick<InvoicingSettings, "gstin" | "state">,
  buyer: Pick<Buyer, "state" | "country" | "gstin"> | null,
): { addsGst: boolean; fallbackState: string | null } {
  const addsGst =
    Boolean(seller.gstin && seller.state) && isIndia(buyer?.country);
  const missing = Boolean(buyer) && !buyer?.gstin && !buyer?.state;
  return {
    addsGst,
    fallbackState:
      addsGst && missing && seller.state ? stateName(seller.state) : null,
  };
}

/**
 * What an invoice for `amount` would add, before it's issued (same rule as
 * the invoice). Null when it carries no GST.
 */
export function taxPreview(
  seller: Pick<InvoicingSettings, "gstin" | "state">,
  buyer: Pick<Buyer, "state" | "country" | "gstin"> | null,
  amount: Minor,
): { tax: Minor; total: Minor; split: string } | null {
  const tax = invoiceTax({
    seller,
    buyer: buyer ?? { state: null, country: null, gstin: null },
    taxable: amount,
  });
  if (tax.kind !== "intra" && tax.kind !== "inter") return null;
  const gst = taxTotal(tax);
  return {
    tax: gst,
    total: sum([amount, gst]),
    split:
      tax.kind === "intra"
        ? `CGST ${GST_RATE_PERCENT / 2}% + SGST ${GST_RATE_PERCENT / 2}%`
        : `IGST ${GST_RATE_PERCENT}%`,
  };
}

/**
 * In words, what GST an invoice to this client will carry, for the client
 * form ("Invoices to Kavya: IGST 18% (Tamil Nadu, a different state from
 * yours)."). Same rule as the invoice itself (invoiceTax).
 */
export function gstOutcome(
  seller: Pick<InvoicingSettings, "gstin" | "state">,
  buyer: Pick<Buyer, "state" | "country" | "gstin">,
  who: string,
): string {
  const tax = invoiceTax({ seller, buyer, taxable: minor(0) });
  const half = GST_RATE_PERCENT / 2;
  switch (tax.kind) {
    case "none":
      return "You don't charge GST, so their GSTIN is only printed on invoices for their records.";
    case "export":
      return `Invoices to ${who}: no GST. They're export invoices, zero-rated under your LUT.`;
    case "intra":
      return !buyer.gstin && !buyer.state
        ? `No state yet, so invoices to ${who} use yours: CGST ${half}% + SGST ${half}%.`
        : `Invoices to ${who}: CGST ${half}% + SGST ${half}% (${stateName(tax.placeOfSupply) ?? tax.placeOfSupply}, same as yours).`;
    case "inter":
      return `Invoices to ${who}: IGST ${GST_RATE_PERCENT}% (${stateName(tax.placeOfSupply) ?? tax.placeOfSupply}, a different state from yours).`;
  }
}
