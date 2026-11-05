import { CURRENCY_INFO, DEFAULT_CURRENCY, type CurrencyCode } from "./currency";

/**
 * Money helpers.
 *
 * RULE: amounts are stored and calculated as integers in the currency's
 * minor unit (paise for INR, cents for USD; every supported currency has
 * 100 minor units to one major). Never use floating-point amounts in
 * business logic. The currency travels with the record (a project's
 * `currency`), not with each number.
 */

declare const minorBrand: unique symbol;
/** An integer amount in minor units of some currency. */
export type Minor = number & { readonly [minorBrand]: true };
/** Minor units of INR. Same type; the name documents rupee-only code. */
export type Paise = Minor;

export function isMinor(value: unknown): value is Minor {
  return typeof value === "number" && Number.isSafeInteger(value);
}

export function minor(value: number): Minor {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Amounts must be safe integers, got ${value}`);
  }
  return value as Minor;
}

/** Rupee-only code (plan prices, marketing). */
export const paise = minor;
export const isPaise = isMinor;

export const ZERO = minor(0);

/**
 * Parses an amount typed by a person ("80,000", "1499.50", "$ 250") into
 * minor units. Allows at most 2 decimal places. Throws on invalid input.
 */
export function parseAmount(input: string | number): Minor {
  const raw = typeof input === "number" ? String(input) : input;
  const cleaned = raw.replace(/[₹$€£,\s]/g, "");
  const match = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) {
    throw new RangeError(`Invalid amount: "${input}"`);
  }
  const [, sign, whole = "0", fraction = ""] = match;
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return minor(sign ? -value : value);
}

/** Major units as a number, for prefilling inputs only, never for maths. */
export function toMajor(amount: Minor): number {
  return amount / 100;
}

export const rupeesToPaise = parseAmount;
export const paiseToRupees = toMajor;

const formatters = new Map<string, Intl.NumberFormat>();
function formatter(currency: CurrencyCode, withMinor: boolean) {
  const key = `${currency}:${withMinor}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(CURRENCY_INFO[currency].locale, {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      minimumFractionDigits: withMinor ? 2 : 0,
      maximumFractionDigits: withMinor ? 2 : 0,
    });
    formatters.set(key, f);
  }
  return f;
}

/**
 * Formats an amount in its currency, dropping ".00" on whole amounts:
 * ₹80,000 · ₹1,23,45,678 (Indian grouping) · $12,000 · €2,400.50 · CA$950.
 */
export function formatMoney(
  amount: Minor,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): string {
  return formatter(currency, amount % 100 !== 0).format(amount / 100);
}

/** Formats paise as Indian rupees: 8000000 → "₹80,000", 149950 → "₹1,499.50". */
export function formatINR(amount: Minor): string {
  return formatMoney(amount, "INR");
}

export function sum(amounts: readonly Minor[]): Minor {
  return minor(amounts.reduce<number>((total, a) => total + a, 0));
}

/**
 * Splits `total` into parts proportional to `weights` (e.g. milestone
 * percentages 30/30/40) so that the parts ALWAYS add up exactly to `total`.
 * Leftover paise from rounding go to the largest remainders first.
 */
export function allocate(total: Minor, weights: readonly number[]): Minor[] {
  if (total < 0) throw new RangeError("total must not be negative");
  if (weights.length === 0) throw new RangeError("weights must not be empty");
  if (weights.some((w) => !Number.isFinite(w) || w < 0)) {
    throw new RangeError("weights must be non-negative numbers");
  }
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum === 0) throw new RangeError("weights must not all be zero");

  const exact = weights.map((w) => (total * w) / weightSum);
  const parts = exact.map(Math.floor);
  let remainder = total - parts.reduce((a, b) => a + b, 0);

  const byRemainder = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  // Hand out the leftover paise one at a time, largest remainder first.
  // remainder < weights.length, so each part gets at most one.
  for (const { index } of byRemainder) {
    if (remainder <= 0) break;
    parts[index] = (parts[index] ?? 0) + 1;
    remainder -= 1;
  }

  return parts.map(minor);
}
