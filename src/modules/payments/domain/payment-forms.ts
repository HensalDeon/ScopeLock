import { z } from "zod";
import { METHOD_KINDS } from "./methods";
import type { ScheduleState } from "./payment";

/** What people type about payments, and the words for each state. */

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.");

const notInFuture = (today: string) => (value: string) => value <= today;

/** The client's "I've paid" (the screenshot travels separately). */
export const REPORT_FIELDS = ["method", "reference", "paidOn", "note"] as const;
export type ReportField = (typeof REPORT_FIELDS)[number];

export function reportInputSchema(today: string) {
  return z.object({
    method: z.enum(METHOD_KINDS, { message: "Choose how you paid." }),
    reference: z
      .string()
      .trim()
      .min(4, "Add the UTR or transaction ID from your payment app or bank.")
      .max(
        40,
        "That reference is too long. Copy just the UTR or transaction ID.",
      )
      .regex(/^[A-Za-z0-9 _/-]+$/, "Use letters and numbers only."),
    paidOn: isoDate.refine(
      notInFuture(today),
      "The payment date can't be in the future.",
    ),
    note: z
      .string()
      .trim()
      .max(300, "Keep the note under 300 characters.")
      .transform((v) => v || null),
  });
}

/** The freelancer marking a payment received themselves. */
export const RECEIVE_FIELDS = [
  "paymentId",
  "method",
  "reference",
  "receivedOn",
] as const;
export function receiveInputSchema(today: string) {
  return z.object({
    method: z.enum(METHOD_KINDS, { message: "Choose how it was paid." }),
    reference: z
      .string()
      .trim()
      .max(40, "Keep the reference under 40 characters.")
      .transform((v) => v || null),
    receivedOn: isoDate.refine(
      notInFuture(today),
      "The date can't be in the future.",
    ),
  });
}

/** "Not received": the client sees this note. */
export const notReceivedSchema = z.object({
  note: z
    .string()
    .trim()
    .min(4, "Tell your client what's missing, so they can check.")
    .max(300, "Keep the note under 300 characters."),
});

export const PAYMENT_STATE_LABELS: Record<ScheduleState, string> = {
  upcoming: "Not requested",
  due: "Due",
  client_reported: "Client says paid",
  received: "Received",
};

/** The same states in the client's words (their portal). */
export const CLIENT_PAYMENT_LABELS: Record<ScheduleState, string> = {
  upcoming: "Not due yet",
  due: "Due",
  client_reported: "Sent for confirmation",
  received: "Paid",
};
