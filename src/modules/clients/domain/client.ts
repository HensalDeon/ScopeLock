import { z } from "zod";
import {
  optionalCurrencyField,
  type CurrencyCode,
} from "@/shared/lib/currency";
import {
  gstinState,
  isGstinFormat,
  isIndia,
  STATE_CODES,
  stateName,
  type StateCode,
} from "@/shared/lib/india";
import { formatPhone, optionalPhoneField } from "@/shared/lib/phone";

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
  /** Billing details for invoices (all optional until GST needs them). */
  address: string | null;
  /** Indian state code (GST), for clients in India. */
  state: StateCode | null;
  /** Null means India. */
  country: string | null;
  gstin: string | null;
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
  "address",
  "state",
  "country",
  "gstin",
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
    .min(1, "Enter the client's name.")
    .min(2, "Enter at least 2 letters of the client's name.")
    .max(
      CLIENT_NAME_MAX_LENGTH,
      `Keep the name under ${CLIENT_NAME_MAX_LENGTH} characters.`,
    ),
  company: optionalText(CLIENT_COMPANY_MAX_LENGTH, "company name"),
  email: optionalEmail,
  phone: optionalPhoneField,
  // Optional so older forms (and the quick-add panel) can leave it out.
  currency: optionalCurrencyField.optional().transform((v) => v ?? null),
  address: optionalText(300, "address")
    .optional()
    .transform((v) => v ?? null),
  state: z
    .union([z.enum(STATE_CODES), z.literal("")])
    .optional()
    .transform((v) => (v || null) as StateCode | null),
  country: optionalText(60, "country")
    .optional()
    .transform((v) => (v && !isIndia(v) ? v : null)),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || isGstinFormat(v), {
      message:
        "That doesn't look like a GSTIN. It's 15 characters, like 27ABCDE1234F1Z5.",
    }),
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

/** A saved client as the edit form's values. */
export function clientFormValues(client: Client): Record<ClientField, string> {
  return {
    name: client.name,
    company: client.company ?? "",
    email: client.email ?? "",
    phone: client.phone ? formatPhone(client.phone) : "",
    currency: client.currency ?? "",
    address: client.address ?? "",
    state: client.state ?? "",
    country: client.country ?? "",
    gstin: client.gstin ?? "",
  };
}

/**
 * "Mehta Interiors · +91 98765 43210 · Maharashtra · Bills in USD", for the
 * client's page. Where they are decides the invoice's tax, so it's shown.
 */
export function clientContactLine(client: Client): string {
  const place = !isIndia(client.country)
    ? client.country
    : stateName(
        (client.gstin && gstinState(client.gstin)) || client.state || "",
      );
  return (
    [
      client.company,
      client.phone && formatPhone(client.phone),
      client.email,
      place,
      client.currency && `Bills in ${client.currency}`,
    ]
      .filter(Boolean)
      .join(" · ") || "No contact details yet"
  );
}

/**
 * Billing details as stored: a GSTIN decides the state (its first two
 * digits), and clients abroad have no Indian state.
 */
export function normalizeBilling<
  T extends Pick<ClientInput, "state" | "country" | "gstin">,
>(input: T): T {
  if (input.country) return { ...input, state: null, gstin: null };
  return input.gstin
    ? { ...input, state: gstinState(input.gstin) ?? input.state }
    : input;
}
