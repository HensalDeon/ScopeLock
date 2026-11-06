import type { Metadata } from "next";
import { Suspense } from "react";
import { methodsFormValues, PaymentMethodsForm } from "@/modules/payments";
import { getPaymentMethods } from "@/modules/payments/server";
import { isStorageConfigured } from "@/shared/lib/env";

export const metadata: Metadata = { title: "Payment settings" };

export default function PaymentSettingsPage() {
  return (
    <Suspense fallback={<div className="h-160 rounded-xl bg-canvas" />}>
      <PaymentSettings />
    </Suspense>
  );
}

async function PaymentSettings() {
  const { methods, qrUrl } = await getPaymentMethods();
  return (
    <div className="grid gap-2">
      <p className="mb-6 max-w-prose text-sm text-pretty text-muted-foreground">
        How your clients pay you. They see these on their payment page. Money
        goes straight to you; ScopeLock never holds it.
      </p>
      <PaymentMethodsForm
        defaults={methodsFormValues(methods)}
        qrUrl={qrUrl}
        uploadsEnabled={isStorageConfigured()}
      />
    </div>
  );
}
