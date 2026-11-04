/**
 * Money helpers.
 *
 * RULE: all amounts are stored and calculated as integer **paise**
 * (₹1 = 100 paise). Never use floating-point rupees in business logic.
 */

declare const paiseBrand: unique symbol;
/** An integer amount in paise. */
export type Paise = number & { readonly [paiseBrand]: true };

export function isPaise(value: unknown): value is Paise {
  return typeof value === "number" && Number.isSafeInteger(value);
}

export function paise(value: number): Paise {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Paise must be a safe integer, got ${value}`);
  }
  return value as Paise;
}

export const ZERO = paise(0);

/**
 * Parses rupees typed by a user ("80,000", "1499.50", 250) into paise.
 * Allows at most 2 decimal places. Throws on invalid input.
 */
export function rupeesToPaise(input: string | number): Paise {
  const raw = typeof input === "number" ? String(input) : input;
  const cleaned = raw.replace(/[₹,\s]/g, "");
  const match = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) {
    throw new RangeError(`Invalid rupee amount: "${input}"`);
  }
  const [, sign, whole, fraction = ""] = match;
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return paise(sign ? -value : value);
}

/** Converts paise to rupees as a number — for display/inputs only, never for maths. */
export function paiseToRupees(amount: Paise): number {
  return amount / 100;
}

const inrWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const inrWithPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats paise as Indian rupees: 8000000 → "₹80,000", 149950 → "₹1,499.50". */
export function formatINR(amount: Paise): string {
  const formatter = amount % 100 === 0 ? inrWhole : inrWithPaise;
  return formatter.format(amount / 100);
}

export function sum(amounts: readonly Paise[]): Paise {
  return paise(amounts.reduce<number>((total, a) => total + a, 0));
}

/**
 * Splits `total` into parts proportional to `weights` (e.g. milestone
 * percentages 30/30/40) so that the parts ALWAYS add up exactly to `total`.
 * Leftover paise from rounding go to the largest remainders first.
 */
export function allocate(total: Paise, weights: readonly number[]): Paise[] {
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

  for (let i = 0; remainder > 0; i = (i + 1) % byRemainder.length) {
    parts[byRemainder[i].index] += 1;
    remainder -= 1;
  }

  return parts.map(paise);
}
