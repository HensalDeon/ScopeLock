import { z } from "zod";
import {
  optionalCurrencyField,
  type CurrencyCode,
} from "@/shared/lib/currency";
import { optionalPhoneField } from "@/shared/lib/phone";

export const CLIENT_NAME_MAX_LENGTH = 120;
export const CLIENT_COMPANY_MAX_LENGTH = 120;

export type Client = {
  id: string;
  name: string;
  company: string | null;
  /** Lowercased. Approval and payment emails go here from Phase 3. */
  email: string | null;
  /** E.164, e.g. +919876543210. */
  phone: string | null;
  /** Default currency for this client's new projects; null = workspace default. */
  currency: CurrencyCode | null;
  /** Archived clients are hidden from lists and pickers; history keeps them. */
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Fields of the add/edit client form. */
export const CLIENT_FIELDS = [
  "name",
  "company",
  "email",
  "phone",
  "currency",
] as const;
export type ClientField = (typeof CLIENT_FIELDS)[number];

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `Keep the ${label} under ${max} characters.`)
    .transform((value) => value || null);

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "That email address is too long.")
  .refine((value) => value === "" || z.email().safeParse(value).success, {
    message: "Enter a valid email address, or leave it empty.",
  })
  .transform((value) => value || null);

export const clientInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the client's name.")
    .max(
      CLIENT_NAME_MAX_LENGTH,
      `Keep the name under ${CLIENT_NAME_MAX_LENGTH} characters.`,
    ),
  company: optionalText(CLIENT_COMPANY_MAX_LENGTH, "company name"),
  email: optionalEmail,
  phone: optionalPhoneField,
  // Optional so older forms (and the quick-add panel) can leave it out.
  currency: optionalCurrencyField.optional().transform((v) => v ?? null),
});

export type ClientInput = z.output<typeof clientInputSchema>;

/** "Rahul Mehta · Mehta Interiors", or just the name. */
export function clientLabel(client: Pick<Client, "name" | "company">): string {
  return client.company ? `${client.name} · ${client.company}` : client.name;
}

/** First name for friendly copy: "Send it to Rahul". */
export function clientFirstName(client: Pick<Client, "name">): string {
  return client.name.trim().split(/\s+/)[0] ?? client.name;
}
