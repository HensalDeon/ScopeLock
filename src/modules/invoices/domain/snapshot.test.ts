import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import { DEFAULT_INVOICING, LUT_ENDORSEMENT } from "./invoice";
import { buildInvoice, issueProblem, projectStatement } from "./snapshot";

const registered = {
  ...DEFAULT_INVOICING,
  legalName: "Asha Menon",
  address: "12/482 Pallimukku Road, Kochi 682016",
  state: "32" as const,
  gstin: "32ABCDE1234F1Z5",
  lutArn: "AD320426012345X",
};
const rahul = {
  name: "Rahul Mehta",
  company: "Mehta Interiors",
  address: "Linking Road, Bandra West, Mumbai 400050",
  state: "27" as const,
  country: null,
  gstin: "27AAACM1234A1Z2",
  email: "rahul@mehtainteriors.in",
};
const base = {
  business: { name: "Asha Studio", email: "asha@example.in" },
  number: "INV/26-27/001",
  issuedOn: "2026-11-08",
  projectName: "Mehta Interiors website",
  paymentLabel: "Design approved",
  lines: [
    { description: "30% of the agreed ₹80,000", amount: minor(2_400_000) },
  ],
  currency: "INR" as const,
  statement: null,
};

describe("buildInvoice", () => {
  it("a GST-registered freelancer billing another state: tax invoice with IGST", () => {
    const inv = buildInvoice({ ...base, settings: registered, buyer: rahul });
    expect(inv.title).toBe("Tax invoice");
    expect(inv.seller).toMatchObject({
      name: "Asha Menon",
      gstin: registered.gstin,
      state: "Kerala (32)",
    });
    expect(inv.buyer).toMatchObject({
      company: "Mehta Interiors",
      state: "Maharashtra (27)",
    });
    expect(inv.lines[0]?.sac).toBe("998314");
    expect(inv.tax).toEqual({
      kind: "inter",
      placeOfSupply: "27",
      igst: minor(432_000),
    });
    expect(inv.total).toBe(minor(2_832_000));
    expect(inv.placeOfSupply).toBe("Maharashtra (27)");
    expect(inv.reverseCharge).toBe(false);
    expect(inv.export).toBeNull();
  });

  it("not registered: a plain invoice with no GST and the business name", () => {
    const inv = buildInvoice({
      ...base,
      settings: DEFAULT_INVOICING,
      buyer: rahul,
    });
    expect(inv.title).toBe("Invoice");
    expect(inv.seller.name).toBe("Asha Studio");
    expect(inv.tax).toEqual({ kind: "none" });
    expect(inv.total).toBe(minor(2_400_000));
    expect(inv.reverseCharge).toBeNull();
    expect(inv.placeOfSupply).toBeNull();
  });

  it("a client abroad: zero-rated export with the LUT endorsement", () => {
    const inv = buildInvoice({
      ...base,
      currency: "USD",
      settings: registered,
      buyer: {
        ...rahul,
        country: "United States",
        state: "27",
        gstin: "27AAACM1234A1Z2",
      },
    });
    expect(inv.tax).toEqual({ kind: "export", country: "United States" });
    expect(inv.total).toBe(minor(2_400_000));
    expect(inv.export).toEqual({
      country: "United States",
      lutArn: registered.lutArn,
      endorsement: LUT_ENDORSEMENT,
    });
    // An Indian state or GSTIN never shows for a client abroad.
    expect(inv.buyer).toMatchObject({
      state: null,
      gstin: null,
      country: "United States",
    });
  });
});

describe("issueProblem", () => {
  it("needs the LUT ARN before invoicing a client abroad (registered only)", () => {
    expect(
      issueProblem({ ...registered, lutArn: null }, { country: "Canada" }),
    ).toMatch(/LUT ARN/);
    expect(issueProblem(registered, { country: "Canada" })).toBeNull();
    expect(issueProblem(DEFAULT_INVOICING, { country: "Canada" })).toBeNull();
    expect(
      issueProblem({ ...registered, lutArn: null }, { country: null }),
    ).toBeNull();
  });
});

describe("projectStatement", () => {
  it("adds up the project and shows what's left after this invoice", () => {
    expect(
      projectStatement({
        originalScope: minor(8_000_000),
        changes: [{ label: "CR-001 Blog", amount: minor(1_500_000) }],
        receivedBefore: minor(4_000_000),
        awaitingBefore: minor(800_000),
        thisInvoice: minor(4_700_000),
      }),
    ).toMatchObject({ projectTotal: minor(9_500_000), balanceAfter: minor(0) });
  });
});
