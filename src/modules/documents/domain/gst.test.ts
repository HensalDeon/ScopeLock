import { approvalAmount, gstChangeNote } from "./document-data";
import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import { gstOver, withGst } from "./gst";

describe("document GST figures", () => {
  it("adds GST per payment and in total", () => {
    const payments = [2_880_000, 2_880_000, 3_840_000].map(minor);
    expect(gstOver(payments, 18)).toEqual({
      tax: 1_728_000,
      total: 11_328_000,
    });
    expect(withGst(minor(1_500_000), 18)).toBe(1_770_000);
  });

  it("no rate (older documents, or no GST): nothing to show", () => {
    expect(gstOver([minor(100)], null)).toBeNull();
    expect(withGst(minor(100), undefined)).toBeNull();
  });
});

describe("approvalAmount", () => {
  it("is what the client will pay", () => {
    expect(approvalAmount(minor(8_000_000), 18, "INR")).toBe(
      "₹94,400 with GST",
    );
    expect(approvalAmount(minor(8_000_000), null, "INR")).toBe("₹80,000");
  });
});

describe("gstChangeNote", () => {
  const base = { clientName: "Rahul Mehta", agreed: "₹80,000" };
  it("explains when invoices now differ from the signed proposal", () => {
    expect(
      gstChangeNote({
        ...base,
        shown: 18,
        now: { gstPercent: null, taxCase: "export" },
      }),
    ).toBe(
      "GST on this proposal was worked out from Rahul Mehta's details when it was sent. Invoices follow the current details, so no GST is charged, as an export of services. The agreed price, ₹80,000, hasn't changed.",
    );
  });
  it("says nothing when nothing changed, or for older proposals", () => {
    expect(
      gstChangeNote({
        ...base,
        shown: 18,
        now: { gstPercent: 18, taxCase: "gst" },
      }),
    ).toBeNull();
    expect(
      gstChangeNote({
        ...base,
        shown: undefined,
        now: { gstPercent: null, taxCase: "none" },
      }),
    ).toBeNull();
  });
});
