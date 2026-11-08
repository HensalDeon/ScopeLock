import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import {
  gstHints,
  buyerProblems,
  invoiceNumber,
  invoiceTax,
  invoicingInputSchema,
  taxTotal,
  toInvoicingSettings,
} from "./invoice";

const kerala = { gstin: "32ABCDE1234F1Z5", state: "32" as const };
const amount = minor(4_700_000); // ₹47,000

describe("invoiceTax", () => {
  it("no GSTIN: no GST at all", () => {
    expect(
      invoiceTax({
        seller: { gstin: null, state: "32" },
        buyer: { state: "27", country: null, gstin: null },
        taxable: amount,
      }),
    ).toEqual({ kind: "none" });
  });

  it("same state: CGST 9% + SGST 9%", () => {
    const tax = invoiceTax({
      seller: kerala,
      buyer: { state: "32", country: "India", gstin: null },
      taxable: amount,
    });
    expect(tax).toEqual({
      kind: "intra",
      placeOfSupply: "32",
      cgst: 423_000,
      sgst: 423_000,
    });
    expect(taxTotal(tax)).toBe(846_000); // ₹8,460
  });

  it("other state: IGST 18%, place of supply from the client's GSTIN first", () => {
    expect(
      invoiceTax({
        seller: kerala,
        buyer: { state: "32", country: null, gstin: "27ABCDE1234F1Z5" },
        taxable: amount,
      }),
    ).toEqual({
      kind: "inter",
      placeOfSupply: "27",
      igst: 846_000,
    });
  });

  it("no address on record: the supplier's own state", () => {
    expect(
      invoiceTax({
        seller: kerala,
        buyer: { state: null, country: null, gstin: null },
        taxable: amount,
      }).kind,
    ).toBe("intra");
  });

  it("client abroad: export, zero-rated", () => {
    expect(
      invoiceTax({
        seller: kerala,
        buyer: { state: null, country: "United States", gstin: null },
        taxable: amount,
      }),
    ).toEqual({
      kind: "export",
      country: "United States",
    });
  });

  it("rounds each half to the paisa", () => {
    const tax = invoiceTax({
      seller: kerala,
      buyer: { state: "32", country: null, gstin: null },
      taxable: minor(333),
    });
    expect(tax).toMatchObject({ cgst: 30, sgst: 30 }); // 29.97 → 30
  });
});

describe("invoiceNumber", () => {
  it("formats within 16 characters", () => {
    expect(invoiceNumber("INV", "26-27", 1)).toBe("INV/26-27/001");
    expect(invoiceNumber("ASHA-", "26-27", 9999)).toBe("ASHA-/26-27/9999");
    expect(() => invoiceNumber("ASHAD", "26-27", 10_000)).toThrow(RangeError);
  });
});

describe("invoicingInputSchema", () => {
  const base = {
    legalName: "",
    address: "",
    state: "",
    gstin: "",
    sac: "998314",
    prefix: "inv",
    startNumber: "1",
    lutArn: "",
  };
  it("works without GST registration", () => {
    expect(invoicingInputSchema.parse(base)).toMatchObject({
      gstin: null,
      prefix: "INV",
      startNumber: 1,
    });
  });
  it("with a GSTIN, needs the legal name, address and the matching state", () => {
    const r = invoicingInputSchema.safeParse({
      ...base,
      gstin: "32abcde1234f1z5",
      state: "27",
    });
    expect(r.error?.issues.map((i) => i.path[0]).sort()).toEqual([
      "address",
      "legalName",
      "state",
    ]);
    const ok = invoicingInputSchema.parse({
      ...base,
      gstin: "32ABCDE1234F1Z5",
      legalName: "Asha Menon",
      address: "Kochi",
    });
    expect(toInvoicingSettings(ok).state).toBe("32"); // taken from the GSTIN
  });
  it("rejects bad SAC codes and prefixes", () => {
    expect(
      invoicingInputSchema.safeParse({ ...base, sac: "99A" }).success,
    ).toBe(false);
    expect(
      invoicingInputSchema.safeParse({ ...base, prefix: "INVOICE" }).success,
    ).toBe(false);
  });
});

describe("buyerProblems", () => {
  const buyer = {
    name: "Rahul",
    company: null,
    address: null,
    state: null,
    country: null,
    gstin: null,
  };
  it("asks for an unregistered client's address from ₹50,000", () => {
    expect(buyerProblems(buyer, minor(4_999_999), kerala)).toEqual([]);
    expect(buyerProblems(buyer, minor(5_000_000), kerala)).toHaveLength(1);
    expect(
      buyerProblems(
        { ...buyer, gstin: "27ABCDE1234F1Z5" },
        minor(9_000_000),
        kerala,
      ),
    ).toEqual([]);
    expect(buyerProblems(buyer, minor(9_000_000), { gstin: null })).toEqual([]);
  });
  it("needs an address on an export invoice", () => {
    expect(
      buyerProblems({ ...buyer, country: "Canada" }, minor(100), kerala),
    ).toHaveLength(1);
  });
});

describe("gstHints", () => {
  const india = { state: null, country: null, gstin: null };
  it("warns when GST applies but the client's state isn't set", () => {
    expect(gstHints(kerala, india)).toEqual({
      addsGst: true,
      fallbackState: "Kerala",
    });
    expect(gstHints(kerala, { ...india, state: "27" })).toEqual({
      addsGst: true,
      fallbackState: null,
    });
    expect(
      gstHints(kerala, { ...india, gstin: "27AAACM1234A1Z2" }).fallbackState,
    ).toBeNull();
  });

  it("no GST without your GSTIN, or for a client abroad", () => {
    expect(gstHints({ gstin: null, state: null }, india)).toEqual({
      addsGst: false,
      fallbackState: null,
    });
    expect(gstHints(kerala, { ...india, country: "Canada" }).addsGst).toBe(
      false,
    );
  });
});
