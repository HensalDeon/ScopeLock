import { z } from "zod";

/**
 * Currencies a project can be billed in. All have two decimal places, so an
 * amount is always an integer number of minor units (paise, cents, fils),
 * 100 to one major unit. Add a 0- or 3-decimal currency (JPY, KWD) only after
 * money.ts learns per-currency minor units.
 */
export const CURRENCIES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "CAD",
  "AUD",
  "SGD",
] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "INR";

type CurrencyInfo = {
  name: string;
  /** Short prefix for amount inputs (unambiguous for Indian users). */
  symbol: string;
  /** Number formatting: Indian grouping for rupees, international otherwise. */
  locale: string;
};

export const CURRENCY_INFO: Record<CurrencyCode, CurrencyInfo> = {
  INR: { name: "Indian rupee", symbol: "₹", locale: "en-IN" },
  USD: { name: "US dollar", symbol: "$", locale: "en-US" },
  EUR: { name: "Euro", symbol: "€", locale: "en-IE" },
  GBP: { name: "British pound", symbol: "£", locale: "en-GB" },
  AED: { name: "UAE dirham", symbol: "AED", locale: "en-US" },
  CAD: { name: "Canadian dollar", symbol: "CA$", locale: "en-US" },
  AUD: { name: "Australian dollar", symbol: "A$", locale: "en-US" },
  SGD: { name: "Singapore dollar", symbol: "S$", locale: "en-US" },
};

export function isCurrency(value: unknown): value is CurrencyCode {
  return CURRENCIES.includes(value as CurrencyCode);
}

/** "USD · US dollar", for pickers. */
export function currencyLabel(code: CurrencyCode): string {
  return `${code} · ${CURRENCY_INFO[code].name}`;
}

export const currencyField = z.enum(CURRENCIES, {
  error: "Choose a currency.",
});

/** An optional currency picker: "" means "use the default" (null). */
export const optionalCurrencyField = z
  .union([z.literal(""), currencyField])
  .transform((value) => (value === "" ? null : value));
