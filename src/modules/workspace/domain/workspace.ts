import { z } from "zod";
import { optionalPhoneField } from "@/shared/lib/phone";

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
  phone: optionalPhoneField,
});

export type WorkspaceDetailsInput = z.input<typeof workspaceDetailsSchema>;
export type WorkspaceDetails = z.output<typeof workspaceDetailsSchema>;
