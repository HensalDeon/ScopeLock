import type { Metadata } from "next";
import { Suspense } from "react";
import { invoicingFormValues, InvoicingForm } from "@/modules/invoices";
import { getInvoicing } from "@/modules/invoices/server";

export const metadata: Metadata = { title: "Invoice settings" };

export default function InvoicingSettingsPage() {
  return (
    <Suspense fallback={<div className="h-160 rounded-xl bg-canvas" />}>
      <InvoicingSettings />
    </Suspense>
  );
}

async function InvoicingSettings() {
  const { settings, series } = await getInvoicing();
  return (
    <div className="grid gap-2">
      <p className="mb-6 max-w-prose text-sm text-pretty text-muted-foreground">
        Every payment you ask for comes with a numbered invoice your client can
        download. Once issued, an invoice doesn&apos;t change; cancelling the
        payment cancels its invoice.
      </p>
      <InvoicingForm defaults={invoicingFormValues(settings)} series={series} />
    </div>
  );
}
