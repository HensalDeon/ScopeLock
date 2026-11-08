import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalInvoicePage } from "@/modules/portal/server";

export const metadata: Metadata = { title: "Invoice" };

export default function ClientInvoicePage({
  params,
}: PageProps<"/c/[token]/invoice/[invoiceId]">) {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden
          className="mx-auto h-[80vh] max-w-[210mm] bg-white/70"
        />
      }
    >
      <Invoice params={params} />
    </Suspense>
  );
}

async function Invoice({
  params,
}: Pick<PageProps<"/c/[token]/invoice/[invoiceId]">, "params">) {
  const { token, invoiceId } = await params;
  return <PortalInvoicePage token={token} invoiceId={invoiceId} />;
}
