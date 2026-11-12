import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { HowToPay } from "@/modules/payments";
import { formatDateTime, formatIsoDate } from "@/shared/lib/dates";
import { isStorageConfigured } from "@/shared/lib/env";
import { cn } from "@/shared/lib/utils";
import { TOUCH_LINK } from "@/shared/ui/touch";
import { formatMoney } from "@/shared/lib/money";
import { reportPayment } from "../server/payment-actions";
import { getPortalPayment } from "../server/queries";
import { Footer, Notice, PortalHeader, StatusStrip } from "./portal-chrome";
import { PrintSetup } from "@/shared/ui/print-setup";
import { ReportPaymentForm } from "./report-payment-form";

/** One payment on the client's link: how much, how to pay, "I've paid". */
export async function PortalPaymentPage({
  token,
  paymentId,
}: {
  token: string;
  paymentId: string;
}) {
  const view = await getPortalPayment(token, paymentId);
  if (view.state === "limited") {
    return (
      <Notice title="Too many requests from this connection">
        Wait about 10 minutes, then reload this page.
      </Notice>
    );
  }
  const { payment, businessName } = view;
  const total = formatMoney(payment.payable, payment.currency);
  const back = (
    <Link
      href={`/c/${token}`}
      aria-label={`Back to ${view.projectTitle}`}
      className="-ml-2 flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted max-sm:size-11"
    >
      <ArrowLeft aria-hidden className="size-4" />
    </Link>
  );

  return (
    <>
      <PortalHeader
        title={`${payment.label} payment · ${businessName}`}
        detail={`${view.projectTitle} · ${total}`}
        back={back}
      />
      {payment.status === "confirmed" && payment.confirmation && (
        <StatusStrip tone="done">
          Paid. {businessName} confirmed they received it on{" "}
          {formatIsoDate(payment.confirmation.receivedOn)}. Thank you.
        </StatusStrip>
      )}
      {payment.status === "client_reported" && payment.report && (
        <StatusStrip tone="waiting">
          You said you paid on {formatIsoDate(payment.report.paidOn)} (UTR{" "}
          {payment.report.reference}). {businessName} will check and confirm.
        </StatusStrip>
      )}
      {payment.status === "due" && payment.lastRejection && (
        <StatusStrip tone="waiting">
          {businessName} hasn&apos;t received it yet: “
          {payment.lastRejection.note}”
        </StatusStrip>
      )}

      {/* Its own print rules: no Chrome header or URL footer, which would
          print this link's secret address for anyone holding the paper. */}
      <PrintSetup footer={`${businessName} · ${payment.label} payment`} />
      <main className="mx-auto grid max-w-[210mm] gap-6 px-4 py-6 sm:py-8">
        <section className="grid gap-3 rounded-lg border bg-white p-5 sm:p-6">
          <h1 className="grid gap-1">
            <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              {payment.status === "confirmed"
                ? `${payment.label}, paid`
                : `${payment.label}, amount due`}
            </span>
            <span className="text-3xl font-semibold tracking-[-0.02em] tabular-nums">
              {total}
            </span>
          </h1>
          {payment.status === "due" && (
            <p className="text-sm text-pretty">
              You pay {businessName} directly.
              {view.branded ? "" : " ScopeLock never holds your money."}
            </p>
          )}
          <ul className="grid gap-1 border-t pt-3 text-sm">
            {payment.lines.map((line) => (
              <li
                key={`${line.kind}-${line.refId}`}
                className="flex justify-between gap-4"
              >
                <span className="text-pretty text-muted-foreground">
                  {line.description}
                </span>
                <span className="tabular-nums">
                  {formatMoney(line.amount, payment.currency)}
                </span>
              </li>
            ))}
            {payment.tax > 0 ? (
              <li className="flex justify-between gap-4">
                <span className="text-muted-foreground">GST</span>
                <span className="tabular-nums">
                  {formatMoney(payment.tax, payment.currency)}
                </span>
              </li>
            ) : (
              view.isExport && (
                <li className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    No GST: export of services under LUT
                  </span>
                  <span className="tabular-nums">
                    {formatMoney(0 as typeof payment.tax, payment.currency)}
                  </span>
                </li>
              )
            )}
          </ul>
          {payment.invoice && (
            <p className="text-sm">
              <Link
                href={`/c/${token}/invoice/${payment.invoice.id}`}
                className={cn(
                  "font-medium underline underline-offset-4",
                  TOUCH_LINK,
                )}
              >
                Invoice {payment.invoice.number}
              </Link>
              <span className="text-muted-foreground">
                {" "}
                · view, print or save as PDF
              </span>
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Asked for on {formatDateTime(payment.requestedAt)}.
          </p>
        </section>

        {payment.status === "due" && (
          <>
            <section aria-labelledby="how-heading" className="grid gap-3">
              <h2 id="how-heading" className="text-base font-semibold">
                How to pay
              </h2>
              <HowToPay
                available={view.available}
                methods={view.methods}
                amount={payment.payable}
                currency={payment.currency}
                qrUrl={view.qrUrl}
                upi={view.upi}
                businessName={businessName}
              />
            </section>
            <section
              aria-labelledby="paid-heading"
              className="grid gap-4 rounded-lg border bg-white p-5 sm:p-6 print:hidden"
            >
              <div className="grid gap-1">
                <h2 id="paid-heading" className="text-base font-semibold">
                  Already paid?
                </h2>
                <p className="text-sm text-pretty text-muted-foreground">
                  Tell {businessName}, with the UTR, so they can find it and
                  confirm.
                </p>
              </div>
              <ReportPaymentForm
                action={reportPayment.bind(null, token, payment.id)}
                methods={view.available}
                amount={total}
                businessName={businessName}
                allowProof={isStorageConfigured()}
              />
            </section>
          </>
        )}
      </main>
      <Footer branded={view.branded} />
    </>
  );
}
