import { ArrowLeft } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getDocumentImages,
  getDocumentSettings,
} from "@/modules/documents/server";
import { INVOICE_STATUS_LABELS, InvoiceDocument } from "@/modules/invoices";
import { getInvoice } from "@/modules/invoices/server";
import { formatMoney } from "@/shared/lib/money";
import { Button } from "@/shared/ui/button";
import { PrintButton } from "@/shared/ui/print-button";

export const metadata: Metadata = { title: "Invoice" };

export default function InvoicePage({
  params,
}: PageProps<"/projects/[id]/invoices/[invoiceId]">) {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden
          className="mx-auto h-[80vh] max-w-[210mm] bg-white/70"
        />
      }
    >
      <InvoiceView params={params} />
    </Suspense>
  );
}

async function InvoiceView({
  params,
}: Pick<PageProps<"/projects/[id]/invoices/[invoiceId]">, "params">) {
  const { id, invoiceId } = await params;
  const [invoice, settings] = await Promise.all([
    getInvoice(id, invoiceId),
    getDocumentSettings(),
  ]);
  if (!invoice) notFound();
  const images = await getDocumentImages(settings);

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-black/10 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Back to project"
            >
              <Link href={`/projects/${id}` as Route}>
                <ArrowLeft aria-hidden />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {invoice.title} {invoice.number}
              </p>
              <p className="truncate text-xs text-muted-foreground tabular-nums">
                {formatMoney(invoice.total, invoice.currency)} ·{" "}
                {INVOICE_STATUS_LABELS[invoice.status]}
              </p>
            </div>
          </div>
          <PrintButton />
        </div>
      </div>
      <div className="mx-auto max-w-[210mm] px-4 pt-4 text-xs text-muted-foreground print:hidden">
        Issued invoices don&apos;t change. To correct one, cancel the payment
        request and ask again: that issues a new invoice with a new number.
      </div>
      <main className="px-0 py-0 sm:px-4 sm:py-4 print:p-0">
        <InvoiceDocument
          invoice={invoice}
          status={invoice.status}
          logoUrl={settings.style.showLogo ? images.logoUrl : null}
          accent={settings.style.accent}
          className="mx-auto max-w-[210mm] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] sm:rounded-[2px] print:max-w-none print:shadow-none"
        />
      </main>
    </>
  );
}
