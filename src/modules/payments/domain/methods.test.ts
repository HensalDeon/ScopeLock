import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import {
  clientSeesLine,
  methodsFor,
  methodsFormValues,
  methodsInputSchema,
  NO_METHODS,
  toMethods,
  upiLink,
} from "./methods";

const empty = Object.fromEntries(
  Object.keys(methodsFormValues(NO_METHODS)).map((k) => [k, ""]),
) as Record<string, string>;

describe("methodsInputSchema", () => {
  it("accepts nothing at all, and cleans what's typed", () => {
    expect(methodsInputSchema.safeParse(empty).success).toBe(true);
    const v = methodsInputSchema.parse({
      ...empty,
      upiVpa: " Asha@OkHDFC ",
      upiPayee: "Asha Menon",
      bankAccountName: "Asha Menon",
      bankAccountNumber: "5010 0123 4567",
      bankIfsc: "hdfc0001234",
      bankName: "HDFC Bank",
      defaultMethod: "upi",
    });
    expect(v).toMatchObject({
      upiVpa: "asha@okhdfc",
      bankAccountNumber: "501001234567",
      bankIfsc: "HDFC0001234",
    });
  });

  it("says exactly what's missing or wrong", () => {
    const paths = (input: Record<string, string>) =>
      (methodsInputSchema.safeParse({ ...empty, ...input }).error?.issues ?? [])
        .map((i) => i.path[0])
        .sort();
    expect(paths({ upiVpa: "asha" })).toEqual(["upiPayee", "upiVpa"]);
    expect(paths({ bankAccountName: "Asha" })).toEqual([
      "bankAccountNumber",
      "bankIfsc",
      "bankName",
    ]);
    expect(
      paths({
        bankAccountName: "A",
        bankAccountNumber: "123456",
        bankName: "HDFC",
        bankIfsc: "HDFC123",
      }),
    ).toEqual(["bankIfsc"]);
    expect(
      paths({ linkLabel: "Razorpay", linkUrl: "http://rzp.io/x" }),
    ).toEqual(["linkUrl"]);
    // Abroad: SWIFT instead of IFSC is fine.
    expect(
      paths({
        bankAccountName: "A",
        bankAccountNumber: "GB29NWBK60161331926819",
        bankName: "NatWest",
        bankSwift: "NWBKGB2L",
      }),
    ).toEqual([]);
  });
});

describe("methodsFor", () => {
  const all = {
    ...toMethods(
      methodsInputSchema.parse({
        ...empty,
        upiVpa: "asha@okhdfc",
        upiPayee: "Asha",
        linkLabel: "PayPal",
        linkUrl: "https://paypal.me/asha",
        defaultMethod: "link",
      }),
      true,
    ),
    qr: { label: "Scan to pay", hasImage: true },
  };
  it("puts the default first; UPI and QR only for rupees", () => {
    expect(methodsFor(all, "INR")).toEqual(["link", "upi", "qr"]);
    expect(methodsFor(all, "USD")).toEqual(["link"]);
  });
});

describe("upiLink", () => {
  it("fills in the amount in rupees with two decimals", () => {
    expect(
      upiLink({
        vpa: "asha@okhdfc",
        payeeName: "Asha Menon",
        amount: minor(4_700_000),
        note: "P-1F107C Before launch",
      }),
    ).toBe(
      "upi://pay?pa=asha%40okhdfc&pn=Asha%20Menon&am=47000.00&cu=INR&tn=P-1F107C%20Before%20launch",
    );
  });
});

describe("clientSeesLine", () => {
  const base = {
    defaultMethod: "",
    upiVpa: "asha@okhdfc",
    bankName: "HDFC Bank",
    linkLabel: "",
  };
  it("lists what's set up, default first, with the useful next one", () => {
    expect(clientSeesLine({ ...base, filled: ["upi"] })).toBe(
      "Your client sees: UPI (asha@okhdfc). Add a bank account for clients who pay by NEFT or from abroad.",
    );
    expect(
      clientSeesLine({
        ...base,
        filled: ["upi", "bank"],
        defaultMethod: "bank",
      }),
    ).toBe("Your client sees: bank transfer to HDFC Bank · UPI (asha@okhdfc).");
  });
  it("says plainly when nothing is set up", () => {
    expect(clientSeesLine({ ...base, filled: [] })).toMatch(/^Nothing yet/);
  });
});
