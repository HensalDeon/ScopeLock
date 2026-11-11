import "server-only";
import {
  webhookSignatureValid,
  type RazorpaySubscriptionEntity,
} from "../domain/razorpay";
import { fetchRazorpaySubscription } from "./razorpay";
import { applyRazorpaySubscription } from "./razorpay-sync";
import { forgetBillingEvent, recordBillingEvent } from "./subscriptions";

type WebhookResult = { status: 200 | 400 | 500; body: string };

/**
 * A Razorpay webhook (renewals, failed payments, cancellations, plan
 * changes). Only trusted when its signature matches the raw body; each
 * event is handled once, however often Razorpay sends it.
 */
export async function handleRazorpayWebhook(input: {
  rawBody: string;
  signature: string | null;
  eventId: string | null;
  secret: string | null;
  /**
   * The subscription as Razorpay has it now. Events can arrive late or out
   * of order (and retries do), so the event's copy is never trusted alone.
   */
  fetchLatest?: (id: string) => Promise<RazorpaySubscriptionEntity>;
}): Promise<WebhookResult> {
  if (
    !input.secret ||
    !input.signature ||
    !webhookSignatureValid(input.rawBody, input.signature, input.secret)
  )
    return { status: 400, body: "bad signature" };

  let event: {
    event?: string;
    payload?: { subscription?: { entity?: RazorpaySubscriptionEntity } };
  };
  try {
    event = JSON.parse(input.rawBody);
  } catch {
    return { status: 400, body: "bad json" };
  }
  const type = event.event ?? "unknown";
  const entity = event.payload?.subscription?.entity;
  // Only subscription events matter to ScopeLock's plans.
  if (!type.startsWith("subscription.") || !entity)
    return { status: 200, body: "ignored" };

  const eventId = input.eventId ?? `${type}:${entity.id}:${entity.status}`;
  if (!(await recordBillingEvent(eventId, type)))
    return { status: 200, body: "already handled" };
  try {
    const latest = await (input.fetchLatest ?? fetchRazorpaySubscription)(
      entity.id,
    );
    await applyRazorpaySubscription(latest);
    return { status: 200, body: "ok" };
  } catch (error) {
    console.error("[razorpay webhook] not applied", type, error);
    await forgetBillingEvent(eventId);
    return { status: 500, body: "retry" };
  }
}
