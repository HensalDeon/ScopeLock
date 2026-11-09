import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalPaymentPage } from "@/modules/portal/server";

export const metadata: Metadata = { title: "Payment" };

export default function ClientPaymentPage({
  params,
}: PageProps<"/c/[token]/pay/[paymentId]">) {
  return (
    <Suspense fallback={<PaymentSkeleton />}>
      <Payment params={params} />
    </Suspense>
  );
}

async function Payment({
  params,
}: Pick<PageProps<"/c/[token]/pay/[paymentId]">, "params">) {
  const { token, paymentId } = await params;
  return <PortalPaymentPage token={token} paymentId={paymentId} />;
}

function PaymentSkeleton() {
  return (
    <div aria-hidden className="mx-auto grid max-w-[210mm] gap-6 px-4 py-8">
      <div className="h-14 bg-white/80" />
      <div className="h-40 rounded-lg bg-white" />
      <div className="h-72 rounded-lg bg-white" />
    </div>
  );
}
