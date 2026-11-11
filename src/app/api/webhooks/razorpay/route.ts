import { connection } from "next/server";
import { handleRazorpayWebhook } from "@/modules/billing/server";
import { env } from "@/shared/lib/env";

/**
 * POST /api/webhooks/razorpay: Razorpay's subscription events for
 * ScopeLock's own plans. Point the webhook here in the Razorpay dashboard
 * with RAZORPAY_WEBHOOK_SECRET as its secret, for the subscription.* events.
 */
export async function POST(request: Request) {
  await connection();
  const result = await handleRazorpayWebhook({
    // The signature covers the exact bytes, so read the raw body.
    rawBody: await request.text(),
    signature: request.headers.get("x-razorpay-signature"),
    eventId: request.headers.get("x-razorpay-event-id"),
    secret: env().RAZORPAY_WEBHOOK_SECRET ?? null,
  });
  return new Response(result.body, { status: result.status });
}
