import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { INVOICE_STATUS_LABELS, InvoiceDocument } from "@/modules/invoices";
import { PrintButton } from "@/shared/ui/print-button";
import { getPortalInvoice } from "../server/queries";
import { Footer, Notice, PortalHeader } from "./portal-chrome";
import { PrintSetup } from "@/shared/ui/print-setup";

/** An invoice on the client's link, ready to print or save as PDF. */
export async function PortalInvoicePage({
  token,
  invoiceId,
}: {
  token: string;
  invoiceId: string;
}) {
  const view = await getPortalInvoice(token, invoiceId);
  if (view.state === "limited") {
    return (
      <Notice title="Too many requests from this connection">
        Wait about 10 minutes, then reload this page.
      </Notice>
    );
  }
  const { invoice } = view;
  return (
    <>
      <PortalHeader
        title={`${invoice.title} ${invoice.number}`}
        detail={`${view.projectTitle} · ${INVOICE_STATUS_LABELS[invoice.status]}`}
        back={
          <Link
            href={
              invoice.status === "cancelled"
                ? `/c/${token}`
                : `/c/${token}/pay/${invoice.paymentId}`
            }
            aria-label="Back to the payment"
            className="-ml-2 flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted max-sm:size-11"
          >
            <ArrowLeft aria-hidden className="size-4" />
          </Link>
        }
      >
        <PrintButton variant="outline" />
      </PortalHeader>
      <PrintSetup
        footer={`${invoice.seller.name} · ${invoice.title} ${invoice.number}`}
      />
      <main className="px-0 py-0 sm:px-4 sm:py-6 print:p-0">
        <InvoiceDocument
          invoice={invoice}
          replacedBy={view.replacedBy}
          status={invoice.status}
          logoUrl={view.logoUrl}
          accent={view.accent}
          className="mx-auto max-w-[210mm] shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] sm:rounded-[2px] print:max-w-none print:shadow-none"
        />
      </main>
      <Footer />
    </>
  );
}
