import { z } from "zod";
import type { CurrencyCode } from "@/shared/lib/currency";
import type { Minor } from "@/shared/lib/money";

/**
 * How a freelancer gets paid. ScopeLock never touches the money: clients
 * pay the freelancer directly, and these details are what the client sees.
 */
export const METHOD_KINDS = ["upi", "bank", "link", "qr", "other"] as const;
export type MethodKind = (typeof METHOD_KINDS)[number];

export const METHOD_LABELS: Record<MethodKind, string> = {
  upi: "UPI",
  bank: "Bank transfer",
  link: "Payment link",
  qr: "QR code",
  other: "Other",
};

export type PaymentMethods = {
  upi: { vpa: string; payeeName: string } | null;
  bank: {
    accountName: string;
    accountNumber: string;
    ifsc: string | null;
    bankName: string;
    branch: string | null;
    /** For payments from abroad. */
    swift: string | null;
    iban: string | null;
  } | null;
  link: { label: string; url: string } | null;
  /** An uploaded QR image (another wallet, a merchant QR). */
  qr: { label: string; hasImage: boolean } | null;
  other: { instructions: string } | null;
  defaultMethod: MethodKind | null;
};

export const NO_METHODS: PaymentMethods = {
  upi: null,
  bank: null,
  link: null,
  qr: null,
  other: null,
  defaultMethod: null,
};

/** At least one way to pay is set up. */
export function hasAnyMethod(methods: PaymentMethods): boolean {
  return Boolean(
    methods.upi || methods.bank || methods.link || methods.qr || methods.other,
  );
}

/** UPI and QR are rupee rails; other currencies use bank, link or other. */
export function methodsFor(
  methods: PaymentMethods,
  currency: CurrencyCode,
): MethodKind[] {
  const set = METHOD_KINDS.filter((kind) => {
    if (kind === "qr")
      return Boolean(methods.qr?.hasImage) && currency === "INR";
    if (kind === "upi") return Boolean(methods.upi) && currency === "INR";
    return Boolean(methods[kind]);
  });
  // The default first, then the rest in the usual order.
  const first = methods.defaultMethod;
  return first && set.includes(first)
    ? [first, ...set.filter((k) => k !== first)]
    : set;
}

/**
 * A UPI deep link with the amount filled in, for the QR code and the "Pay
 * with a UPI app" button. `note` shows in the payer's app (kept short).
 */
export function upiLink(input: {
  vpa: string;
  payeeName: string;
  amount: Minor;
  note: string;
}): string {
  const params = new URLSearchParams({
    pa: input.vpa,
    pn: input.payeeName,
    am: (input.amount / 100).toFixed(2),
    cu: "INR",
    tn: input.note.slice(0, 50),
  });
  return `upi://pay?${params.toString().replace(/\+/g, "%20")}`;
}

// ── Settings form ──────────────────────────────────────────────────────────

export const METHOD_FIELDS = [
  "upiVpa",
  "upiPayee",
  "bankAccountName",
  "bankAccountNumber",
  "bankIfsc",
  "bankName",
  "bankBranch",
  "bankSwift",
  "bankIban",
  "linkLabel",
  "linkUrl",
  "qrLabel",
  "otherInstructions",
  "defaultMethod",
] as const;
export type MethodField = (typeof METHOD_FIELDS)[number];

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .transform((v) => v || null);

const VPA = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const SWIFT = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const IBAN = /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/;

export const methodsInputSchema = z
  .object({
    upiVpa: text(256).transform((v) => v?.toLowerCase() ?? null),
    upiPayee: text(80),
    bankAccountName: text(120),
    bankAccountNumber: text(34).transform(
      (v) => v?.replace(/\s+/g, "") ?? null,
    ),
    bankIfsc: text(11).transform((v) => v?.toUpperCase() ?? null),
    bankName: text(120),
    bankBranch: text(120),
    bankSwift: text(11).transform(
      (v) => v?.toUpperCase().replace(/\s+/g, "") ?? null,
    ),
    bankIban: text(34).transform(
      (v) => v?.toUpperCase().replace(/\s+/g, "") ?? null,
    ),
    linkLabel: text(60),
    linkUrl: text(500),
    qrLabel: text(60),
    otherInstructions: text(1000),
    defaultMethod: z
      .union([z.enum(METHOD_KINDS), z.literal("")])
      .transform((v) => v || null),
  })
  .superRefine((v, ctx) => {
    const need = (ok: unknown, path: MethodField, message: string) => {
      if (!ok) ctx.addIssue({ code: "custom", path: [path], message });
    };
    // UPI: both or neither.
    if (v.upiVpa || v.upiPayee) {
      need(v.upiVpa, "upiVpa", "Add your UPI ID, like asha@okhdfc.");
      need(v.upiPayee, "upiPayee", "Add the name your UPI app shows.");
    }
    if (v.upiVpa && !VPA.test(v.upiVpa)) {
      need(
        false,
        "upiVpa",
        "That doesn't look like a UPI ID. It looks like name@bank.",
      );
    }
    // Bank: name, number and bank, plus IFSC (India) or SWIFT (abroad).
    const bankStarted = [
      v.bankAccountName,
      v.bankAccountNumber,
      v.bankIfsc,
      v.bankName,
      v.bankBranch,
      v.bankSwift,
      v.bankIban,
    ].some(Boolean);
    if (bankStarted) {
      need(
        v.bankAccountName,
        "bankAccountName",
        "Add the account holder's name.",
      );
      need(v.bankAccountNumber, "bankAccountNumber", "Add the account number.");
      need(v.bankName, "bankName", "Add the bank's name.");
      need(
        v.bankIfsc || v.bankSwift,
        "bankIfsc",
        "Add the IFSC code (or a SWIFT code for payments from abroad).",
      );
    }
    if (v.bankAccountNumber && !/^[A-Z0-9]{6,34}$/i.test(v.bankAccountNumber)) {
      need(
        false,
        "bankAccountNumber",
        "Use digits (and letters for some foreign accounts) only.",
      );
    }
    if (v.bankIfsc && !IFSC.test(v.bankIfsc)) {
      need(
        false,
        "bankIfsc",
        "An IFSC code is 11 characters, like HDFC0001234.",
      );
    }
    if (v.bankSwift && !SWIFT.test(v.bankSwift)) {
      need(
        false,
        "bankSwift",
        "A SWIFT code is 8 or 11 characters, like HDFCINBB.",
      );
    }
    if (v.bankIban && !IBAN.test(v.bankIban)) {
      need(false, "bankIban", "That doesn't look like an IBAN.");
    }
    // Link: both or neither, and a real https address.
    if (v.linkLabel || v.linkUrl) {
      need(v.linkUrl, "linkUrl", "Add the link, starting with https://.");
      need(v.linkLabel, "linkLabel", "Name it, like Razorpay or PayPal.");
    }
    if (v.linkUrl) {
      let ok = false;
      try {
        ok = new URL(v.linkUrl).protocol === "https:";
      } catch {
        ok = false;
      }
      need(ok, "linkUrl", "Use a full https:// link.");
    }
  });

export type MethodsInput = z.output<typeof methodsInputSchema>;

/** Form input → stored methods (the QR image is handled by its own upload). */
export function toMethods(
  input: MethodsInput,
  hasQrImage: boolean,
): Omit<PaymentMethods, "qr"> & { qr: { label: string } | null } {
  return {
    upi:
      input.upiVpa && input.upiPayee
        ? { vpa: input.upiVpa, payeeName: input.upiPayee }
        : null,
    bank:
      input.bankAccountName && input.bankAccountNumber && input.bankName
        ? {
            accountName: input.bankAccountName,
            accountNumber: input.bankAccountNumber,
            ifsc: input.bankIfsc,
            bankName: input.bankName,
            branch: input.bankBranch,
            swift: input.bankSwift,
            iban: input.bankIban,
          }
        : null,
    link:
      input.linkUrl && input.linkLabel
        ? { label: input.linkLabel, url: input.linkUrl }
        : null,
    qr: hasQrImage ? { label: input.qrLabel ?? "Scan to pay" } : null,
    other: input.otherInstructions
      ? { instructions: input.otherInstructions }
      : null,
    defaultMethod: input.defaultMethod,
  };
}

/** Stored methods → form values. */
export function methodsFormValues(
  m: PaymentMethods,
): Record<MethodField, string> {
  return {
    upiVpa: m.upi?.vpa ?? "",
    upiPayee: m.upi?.payeeName ?? "",
    bankAccountName: m.bank?.accountName ?? "",
    bankAccountNumber: m.bank?.accountNumber ?? "",
    bankIfsc: m.bank?.ifsc ?? "",
    bankName: m.bank?.bankName ?? "",
    bankBranch: m.bank?.branch ?? "",
    bankSwift: m.bank?.swift ?? "",
    bankIban: m.bank?.iban ?? "",
    linkLabel: m.link?.label ?? "",
    linkUrl: m.link?.url ?? "",
    qrLabel: m.qr?.label ?? "",
    otherInstructions: m.other?.instructions ?? "",
    defaultMethod: m.defaultMethod ?? "",
  };
}

/**
 * Settings → Payments, live: what a client will be offered, in words, and
 * the one thing worth adding. Default method first.
 */
export function clientSeesLine(input: {
  filled: readonly MethodKind[];
  defaultMethod: string;
  upiVpa: string;
  bankName: string;
  linkLabel: string;
}): string {
  if (input.filled.length === 0)
    return "Nothing yet. Clients will be told to ask you how to pay, so add a UPI ID or a bank account below.";
  const words: Record<MethodKind, string> = {
    upi: `UPI (${input.upiVpa})`,
    bank: `bank transfer${input.bankName ? ` to ${input.bankName}` : ""}`,
    link: input.linkLabel || "your payment link",
    qr: "your QR code",
    other: "your own instructions",
  };
  const ordered = [...input.filled].sort(
    (a, b) =>
      Number(b === input.defaultMethod) - Number(a === input.defaultMethod),
  );
  const tip = !input.filled.includes("bank")
    ? " Add a bank account for clients who pay by NEFT or from abroad."
    : !input.filled.includes("upi")
      ? " Add a UPI ID so clients in India can pay from their phone."
      : "";
  return `Your client sees: ${ordered.map((k) => words[k]).join(" · ")}.${tip}`;
}

/**
 * The "Pay to" details frozen into an invoice when it's issued: UPI (rupees
 * only), bank and payment link. Null when none is set up.
 */
export function payToFrom(
  methods: PaymentMethods,
  currency: CurrencyCode,
): {
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
} | null {
  const upi = currency === "INR" ? methods.upi : null;
  const bank = methods.bank && {
    accountName: methods.bank.accountName,
    accountNumber: methods.bank.accountNumber,
    ifsc: methods.bank.ifsc,
    bankName: methods.bank.bankName,
    swift: methods.bank.swift,
    iban: methods.bank.iban,
  };
  const link = methods.link;
  return upi || bank || link
    ? { upi: upi ?? null, bank: bank ?? null, link: link ?? null }
    : null;
}
