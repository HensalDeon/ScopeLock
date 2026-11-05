import { z } from "zod";

/**
 * Normalises a phone number to E.164.
 * - 10-digit Indian mobiles (with or without 0 / 91 / +91) → +91XXXXXXXXXX
 * - Anything starting with + and 8–15 digits is kept as an international number
 * Returns null if it doesn't look like a phone number.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");

  const indian = /^(?:0|91)?([6-9]\d{9})$/.exec(digits);
  if (indian && !(trimmed.startsWith("+") && !trimmed.startsWith("+91"))) {
    return `+91${indian[1]}`;
  }
  if (trimmed.startsWith("+") && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
}

/** +919876543210 → "+91 98765 43210" (Indian grouping); others unchanged. */
export function formatPhone(e164: string): string {
  const m = /^\+91(\d{5})(\d{5})$/.exec(e164);
  return m ? `+91 ${m[1]} ${m[2]}` : e164;
}

/**
 * A wa.me link that opens WhatsApp with this number (and optionally a
 * message ready to send). Works on phones and WhatsApp Web.
 */
export function whatsappLink(e164: string, message?: string): string {
  const url = new URL(`https://wa.me/${e164.replace(/\D/g, "")}`);
  if (message) url.searchParams.set("text", message);
  return url.toString();
}

/** Optional phone form field: "" → null, otherwise normalised or an error. */
export const optionalPhoneField = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return null;
    const phone = normalizePhone(value);
    if (!phone) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a 10-digit mobile number, or include the country code.",
      });
      return z.NEVER;
    }
    return phone;
  });
