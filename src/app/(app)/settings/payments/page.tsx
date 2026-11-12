import type { Metadata } from "next";
import { Suspense } from "react";
import {
  AutoRemindersSetting,
  methodsFormValues,
  PaymentMethodsForm,
} from "@/modules/payments";
import {
  getAutoReminderSetting,
  getPaymentMethods,
} from "@/modules/payments/server";
import { Section } from "@/shared/ui/page";
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
  const [{ methods, qrUrl }, reminders] = await Promise.all([
    getPaymentMethods(),
    getAutoReminderSetting(),
  ]);
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
      <div className="mt-8 border-t pt-8">
        <Section id="reminders" title="Automatic reminders">
          <AutoRemindersSetting {...reminders} />
        </Section>
      </div>
    </div>
  );
}
