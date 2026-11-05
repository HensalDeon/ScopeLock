import { z } from "zod";

export const BUSINESS_TYPES = ["freelancer", "studio", "agency"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const BUSINESS_TYPE_LABELS: Record<
  BusinessType,
  { title: string; detail: string }
> = {
  freelancer: { title: "Freelancer", detail: "Just me" },
  studio: { title: "Studio", detail: "2–10 people" },
  agency: { title: "Agency", detail: "10+ people" },
};

export const BUSINESS_NAME_MAX_LENGTH = 80;

/** Fields of the business details form (onboarding and settings). */
export const WORKSPACE_FIELDS = [
  "businessName",
  "businessType",
  "phone",
] as const;
export type WorkspaceField = (typeof WORKSPACE_FIELDS)[number];

export type WorkspaceProfile = {
  /** Better Auth organization id. */
  workspaceId: string;
  businessName: string;
  businessType: BusinessType;
  /** E.164, e.g. +919876543210. Shown to clients on approval pages. */
  phone: string | null;
  currency: "INR";
  createdAt: Date;
  updatedAt: Date;
};

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

/** URL-safe workspace slug with a short random suffix to avoid clashes. */
export function workspaceSlug(name: string, suffix: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return `${base || "workspace"}-${suffix}`;
}

const phoneField = z
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

export const workspaceDetailsSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(
      BUSINESS_NAME_MAX_LENGTH,
      `Keep it under ${BUSINESS_NAME_MAX_LENGTH} characters.`,
    ),
  businessType: z.enum(BUSINESS_TYPES, {
    error: "Choose how you work.",
  }),
  phone: phoneField,
});

export type WorkspaceDetailsInput = z.input<typeof workspaceDetailsSchema>;
export type WorkspaceDetails = z.output<typeof workspaceDetailsSchema>;
