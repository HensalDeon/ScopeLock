/**
 * Razorpay, as plain rules: checking signatures and reading a subscription
 * entity into our record. No network here (see server/razorpay.ts).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PlanId } from "./plans";
import {
  RAZORPAY_STATUSES,
  type RazorpayState,
  type RazorpayStatus,
  type Subscription,
} from "./subscription";

export function hmacHex(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

function sameHex(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Checkout's success callback: HMAC(payment_id|subscription_id, key secret). */
export function checkoutSignatureValid(
  input: { paymentId: string; subscriptionId: string; signature: string },
  keySecret: string,
): boolean {
  return sameHex(
    hmacHex(keySecret, `${input.paymentId}|${input.subscriptionId}`),
    input.signature,
  );
}

/** A webhook: HMAC of the exact raw body with the webhook secret. */
export function webhookSignatureValid(
  rawBody: string,
  signature: string,
  webhookSecret: string,
): boolean {
  return sameHex(hmacHex(webhookSecret, rawBody), signature);
}

/** The parts of Razorpay's subscription entity we read. */
export type RazorpaySubscriptionEntity = {
  id: string;
  plan_id: string;
  status: string;
  current_end?: number | null;
  ended_at?: number | null;
  notes?: Record<string, string> | unknown[] | null;
  has_scheduled_changes?: boolean;
  short_url?: string | null;
};

export function notesOf(
  entity: Pick<RazorpaySubscriptionEntity, "notes">,
): Record<string, string> {
  const n = entity.notes;
  return n && !Array.isArray(n) ? (n as Record<string, string>) : {};
}

const toStatus = (s: string): RazorpayStatus =>
  (RAZORPAY_STATUSES as readonly string[]).includes(s)
    ? (s as RazorpayStatus)
    : "halted";

/**
 * Our record from Razorpay's entity. `planFor` maps their plan id to ours
 * (null if it isn't one of ours). Keeps what only we know: a cancellation
 * the customer asked for, a downgrade scheduled for the next cycle.
 */
export function subscriptionFromRazorpay(
  entity: RazorpaySubscriptionEntity,
  planFor: (razorpayPlanId: string) => PlanId | null,
  previous: Subscription | null,
  at: Date,
): Subscription | null {
  const planId = planFor(entity.plan_id);
  if (!planId) return null;
  const before =
    previous?.razorpay?.subscriptionId === entity.id ? previous.razorpay : null;
  const status = toStatus(entity.status);
  const scheduled =
    before?.scheduledPlanId && entity.has_scheduled_changes !== false
      ? before.scheduledPlanId
      : null;
  const razorpay: RazorpayState = {
    subscriptionId: entity.id,
    status,
    razorpayPlanId: entity.plan_id,
    currentEnd: entity.current_end ? new Date(entity.current_end * 1000) : null,
    cancelAtCycleEnd:
      status === "cancelled" || (before?.cancelAtCycleEnd ?? false),
    scheduledPlanId: scheduled === planId ? null : scheduled,
    shortUrl: entity.short_url ?? before?.shortUrl ?? null,
  };
  return {
    planId,
    source: "razorpay",
    note: null,
    setBy: null,
    setAt: at,
    razorpay,
  };
}
