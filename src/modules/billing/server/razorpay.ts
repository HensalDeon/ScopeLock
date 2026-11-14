import "server-only";
import { env } from "@/shared/lib/env";
import { UserError } from "@/shared/lib/form-state";
import type { RazorpaySubscriptionEntity } from "../domain/razorpay";

/**
 * The few Razorpay calls ScopeLock's own billing needs (plans and
 * subscriptions), with the server's key. Razorpay's own message is logged;
 * people see a plain one.
 */
const BASE = "https://api.razorpay.com/v1";

/** 10 years of monthly charges: a plan that renews until cancelled. */
const MONTHS = 120;

function keys() {
  const e = env();
  if (!e.RAZORPAY_KEY_ID || !e.RAZORPAY_KEY_SECRET)
    throw new UserError("Paid plans aren't open yet.");
  return { id: e.RAZORPAY_KEY_ID, secret: e.RAZORPAY_KEY_SECRET };
}

async function call<T>(
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown,
): Promise<T> {
  const { id, secret } = keys();
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await response.json().catch(() => ({}))) as {
    error?: { description?: string };
  };
  if (!response.ok) {
    const description = json.error?.description ?? "";
    console.error(
      `[razorpay] ${method} ${path} failed (${response.status})`,
      description,
    );
    // Razorpay can't change a plan paid by UPI AutoPay or e-mandate.
    if (
      /cannot be updated when payment mode is (upi|emandate)/i.test(description)
    )
      throw new UserError(
        "Razorpay can't change a plan paid by UPI AutoPay or e-mandate. Cancel this plan, then start the new one when it ends.",
      );
    throw new UserError(
      response.status === 401
        ? "Payments aren't set up correctly yet. Nothing was charged; please contact us."
        : "Razorpay didn't accept that. Nothing was charged; please try again.",
    );
  }
  return json as T;
}

/** A monthly Razorpay plan for one of our prices (amount in paise, INR). */
export async function createRazorpayPlan(input: {
  name: string;
  amount: number;
  description: string;
}): Promise<string> {
  const plan = await call<{ id: string }>("POST", "/plans", {
    period: "monthly",
    interval: 1,
    item: {
      name: input.name,
      amount: input.amount,
      currency: "INR",
      description: input.description,
    },
  });
  return plan.id;
}

export async function createRazorpaySubscription(input: {
  razorpayPlanId: string;
  notes: Record<string, string>;
}): Promise<RazorpaySubscriptionEntity> {
  return call("POST", "/subscriptions", {
    plan_id: input.razorpayPlanId,
    total_count: MONTHS,
    quantity: 1,
    customer_notify: 1,
    notes: input.notes,
  });
}

export async function fetchRazorpaySubscription(
  id: string,
): Promise<RazorpaySubscriptionEntity> {
  return call("GET", `/subscriptions/${encodeURIComponent(id)}`);
}

/**
 * Stops renewing. At cycle end (default) the period already paid for runs
 * to its end; immediately for a stray second subscription.
 */
export async function cancelRazorpaySubscription(
  id: string,
  when: "cycle_end" | "now" = "cycle_end",
): Promise<RazorpaySubscriptionEntity> {
  return call("POST", `/subscriptions/${encodeURIComponent(id)}/cancel`, {
    cancel_at_cycle_end: when === "cycle_end" ? 1 : 0,
  });
}

/** Drops a plan change scheduled for the next billing date. */
export async function cancelScheduledRazorpayChange(
  id: string,
): Promise<RazorpaySubscriptionEntity> {
  return call(
    "POST",
    `/subscriptions/${encodeURIComponent(id)}/cancel_scheduled_changes`,
  );
}

/** Moves to another plan: now (upgrade) or at the next billing date. */
export async function changeRazorpayPlan(
  id: string,
  razorpayPlanId: string,
  when: "now" | "cycle_end",
): Promise<RazorpaySubscriptionEntity> {
  return call("PATCH", `/subscriptions/${encodeURIComponent(id)}`, {
    plan_id: razorpayPlanId,
    schedule_change_at: when,
    customer_notify: 1,
  });
}

/** Test or live, from the key in use (their plans don't mix). */
export function razorpayMode(): "test" | "live" {
  return keys().id.startsWith("rzp_live_") ? "live" : "test";
}

/** The key id is public (Checkout needs it in the browser). */
export function razorpayKeyId(): string {
  return keys().id;
}

export function razorpaySecrets(): { key: string; webhook: string | null } {
  const e = env();
  return { key: keys().secret, webhook: e.RAZORPAY_WEBHOOK_SECRET ?? null };
}
