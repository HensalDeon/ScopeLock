"use client";

import { useRouter } from "next/navigation";
import { useContext, useState, useTransition } from "react";
import { IDLE } from "@/shared/lib/form-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { confirmCheckout, startCheckout } from "../server/checkout-actions";
import { Busy, Note, type Payer } from "./checkout-lock";
import { loadCheckout, type RazorpayResponse } from "./razorpay-checkout";

type Step = "idle" | "opening" | "paying" | "confirming" | "paid";

/**
 * Pay for a plan in Razorpay Checkout: a subscription is made on the
 * server, paid in Razorpay's window, then confirmed on the server. Once
 * Razorpay has taken the payment, the button never comes back on this page
 * (a second click would be a second subscription).
 */
export function CheckoutButton({
  planId,
  label,
  description,
  keyId,
  payer,
  hint,
}: {
  planId: string;
  label: string;
  /** Shown in Razorpay's window ("Pro plan, ₹499 a month"). */
  description: string;
  /** What's charged and when, under the button. */
  hint: string;
  keyId: string;
  payer: Payer;
}) {
  const router = useRouter();
  const lock = useContext(Busy);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const idle = () => {
    setStep("idle");
    lock.setBusy(false);
  };

  const confirm = (r: RazorpayResponse) =>
    startTransition(async () => {
      setStep("confirming");
      const data = new FormData();
      data.set("paymentId", r.razorpay_payment_id);
      data.set("subscriptionId", r.razorpay_subscription_id);
      data.set("signature", r.razorpay_signature);
      const result = await confirmCheckout(IDLE, data);
      // Success refreshes the page with the new plan; otherwise wait for
      // Razorpay's own confirmation (the webhook), never pay again.
      setStep("paid");
      if (result.status === "error") setError(result.message ?? null);
    });

  const pay = () =>
    startTransition(async () => {
      setError(null);
      setStep("opening");
      lock.setBusy(true);
      const data = new FormData();
      data.set("planId", planId);
      const started = await startCheckout(IDLE, data);
      if (started.status !== "success" || !started.id) {
        idle();
        setError(
          started.status === "error"
            ? (started.message ?? "Couldn't open the payment.")
            : "Couldn't open the payment.",
        );
        return;
      }
      const Razorpay = await loadCheckout();
      if (!Razorpay) {
        idle();
        setError(
          "Razorpay's payment window didn't load. Check your connection and try again. Nothing was charged.",
        );
        return;
      }
      const checkout = new Razorpay({
        key: keyId,
        subscription_id: started.id,
        name: "ScopeLock",
        description,
        prefill: {
          name: payer.name,
          email: payer.email,
          ...(payer.contact ? { contact: payer.contact } : {}),
        },
        theme: { color: "#0b1220" },
        handler: confirm,
        modal: { ondismiss: idle },
      });
      checkout.on("payment.failed", (r) =>
        setError(
          `The payment didn't go through${r.error.description ? `: ${r.error.description.replace(/\.+$/, "")}` : ""}. Nothing was charged; you can try again or pay another way.`,
        ),
      );
      setStep("paying");
      checkout.open();
    });

  if (step === "paid")
    return (
      <Note ok>
        <span className="font-medium text-foreground">Payment received.</span>{" "}
        {error ??
          "Waiting for Razorpay to confirm it; your plan updates within a few minutes."}{" "}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn("mt-2", TOUCH)}
          onClick={() => router.refresh()}
        >
          Check again
        </Button>
      </Note>
    );

  return (
    <>
      <Button
        type="button"
        size="sm"
        className={TOUCH}
        disabled={step !== "idle" || lock.busy}
        onClick={pay}
      >
        {step === "opening"
          ? "Opening Razorpay…"
          : step === "paying"
            ? "Paying in Razorpay…"
            : step === "confirming"
              ? "Confirming payment…"
              : label}
      </Button>
      {error ? (
        <Note ok={false}>{error}</Note>
      ) : (
        step === "idle" && <Note ok>{hint}</Note>
      )}
    </>
  );
}
