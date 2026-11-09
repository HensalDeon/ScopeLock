import type { CurrencyCode } from "@/shared/lib/currency";
import type { Minor } from "@/shared/lib/money";

/**
 * The total in words, as accountants expect on an invoice: "Rupees
 * twenty-eight thousand three hundred and twenty only". Rupees use the
 * Indian system (lakh, crore); other currencies use thousand and million.
 */

const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

/** 0–999 in words ("three hundred and twenty"). */
function belowThousand(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const restWords =
    rest < 20
      ? ONES[rest]
      : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? `-${ONES[rest % 10]}` : ""}`;
  if (!hundreds) return restWords ?? "";
  return `${ONES[hundreds]} hundred${rest ? ` and ${restWords}` : ""}`;
}

function indian(n: number): string {
  if (n === 0) return "zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1_00_00_000);
  const lakh = Math.floor((n % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((n % 1_00_000) / 1_000);
  const rest = n % 1_000;
  if (crore) parts.push(`${indian(crore)} crore`);
  if (lakh) parts.push(`${belowThousand(lakh)} lakh`);
  if (thousand) parts.push(`${belowThousand(thousand)} thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(" ");
}

function international(n: number): string {
  if (n === 0) return "zero";
  const parts: string[] = [];
  const billion = Math.floor(n / 1e9);
  const million = Math.floor((n % 1e9) / 1e6);
  const thousand = Math.floor((n % 1e6) / 1e3);
  const rest = n % 1e3;
  if (billion) parts.push(`${belowThousand(billion)} billion`);
  if (million) parts.push(`${belowThousand(million)} million`);
  if (thousand) parts.push(`${belowThousand(thousand)} thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(" ");
}

const NAMES: Record<CurrencyCode, { major: string; minor: string }> = {
  INR: { major: "Rupees", minor: "paise" },
  USD: { major: "US dollars", minor: "cents" },
  EUR: { major: "Euros", minor: "cents" },
  GBP: { major: "Pounds sterling", minor: "pence" },
  AED: { major: "UAE dirhams", minor: "fils" },
  CAD: { major: "Canadian dollars", minor: "cents" },
  AUD: { major: "Australian dollars", minor: "cents" },
  SGD: { major: "Singapore dollars", minor: "cents" },
};

export function amountInWords(amount: Minor, currency: CurrencyCode): string {
  const words = currency === "INR" ? indian : international;
  const major = Math.floor(amount / 100);
  const cents = amount % 100;
  const name = NAMES[currency];
  return `${name.major} ${words(major)}${cents ? ` and ${words(cents)} ${name.minor}` : ""} only`;
}
