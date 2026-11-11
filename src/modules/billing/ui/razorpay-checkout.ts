"use client";

/** Razorpay Checkout in the browser: its script, loaded only when paying. */
export type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    cb: (r: { error: { description?: string } }) => void,
  ) => void;
};

export type RazorpayConstructor = new (
  options: Record<string, unknown>,
) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

/** Razorpay's Checkout, or null if its script didn't load. */
export async function loadCheckout(): Promise<RazorpayConstructor | null> {
  if (!window.Razorpay) {
    try {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = SCRIPT;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("checkout script"));
        document.head.append(s);
      });
    } catch {
      return null;
    }
  }
  return window.Razorpay ?? null;
}
