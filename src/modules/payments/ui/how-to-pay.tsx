import { ExternalLink } from "lucide-react";
import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney, type Minor } from "@/shared/lib/money";
import {
  METHOD_LABELS,
  type MethodKind,
  type PaymentMethods,
} from "../domain/methods";

/**
 * The ways a client can pay one amount, default first. UPI comes with a QR
 * code (amount filled in) and a button that opens a UPI app on phones.
 */
export function HowToPay({
  available,
  methods,
  amount,
  currency,
  qrUrl,
  upi,
  businessName,
}: {
  available: MethodKind[];
  methods: PaymentMethods;
  amount: Minor;
  currency: CurrencyCode;
  qrUrl: string | null;
  upi: { link: string; qrSvg: string } | null;
  businessName: string;
}) {
  if (available.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {businessName} hasn&apos;t added payment details yet. Ask them how to
        pay.
      </p>
    );
  }
  const total = formatMoney(amount, currency);
  return (
    <ol className="grid gap-3">
      {available.map((kind) => (
        <li key={kind} className="grid gap-3 rounded-lg border bg-white p-4">
          <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            {METHOD_LABELS[kind]}
          </p>
          {kind === "upi" && methods.upi && (
            <div className="grid items-center gap-4 sm:grid-cols-[11rem_minmax(0,1fr)]">
              {upi && (
                // Phones: the UPI app button comes first (you can't scan a
                // QR shown on the same phone).
                <a
                  href={upi.link}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80 sm:hidden"
                >
                  Pay {total} with a UPI app
                </a>
              )}
              {upi && (
                <p className="-mb-2 text-sm text-muted-foreground sm:hidden">
                  Paying from another phone or a laptop? Scan this.
                </p>
              )}
              {upi && (
                <div
                  role="img"
                  aria-label={`UPI QR code for ${total} to ${methods.upi.payeeName}`}
                  className="size-44 justify-self-center rounded-md border bg-white p-1 [&_svg]:size-full"
                  // Generated on the server from our own validated UPI ID.
                  dangerouslySetInnerHTML={{ __html: upi.qrSvg }}
                />
              )}
              <div className="grid gap-2 text-sm">
                <p className="text-pretty">
                  Scan with any UPI app.{" "}
                  <span className="font-medium tabular-nums">{total}</span> is
                  filled in.
                </p>
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
                  <dt className="text-muted-foreground">UPI ID</dt>
                  <dd className="font-mono break-all">{methods.upi.vpa}</dd>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd>{methods.upi.payeeName}</dd>
                </dl>
              </div>
            </div>
          )}
          {kind === "bank" && methods.bank && (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Account name</dt>
              <dd>{methods.bank.accountName}</dd>
              <dt className="text-muted-foreground">Account number</dt>
              <dd className="font-mono break-all">
                {methods.bank.accountNumber}
              </dd>
              {methods.bank.ifsc && (
                <>
                  <dt className="text-muted-foreground">IFSC</dt>
                  <dd className="font-mono">{methods.bank.ifsc}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Bank</dt>
              <dd>
                {methods.bank.bankName}
                {methods.bank.branch ? `, ${methods.bank.branch}` : ""}
              </dd>
              {methods.bank.swift && (
                <>
                  <dt className="text-muted-foreground">SWIFT</dt>
                  <dd className="font-mono">{methods.bank.swift}</dd>
                </>
              )}
              {methods.bank.iban && (
                <>
                  <dt className="text-muted-foreground">IBAN</dt>
                  <dd className="font-mono break-all">{methods.bank.iban}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-medium tabular-nums">{total}</dd>
            </dl>
          )}
          {kind === "link" && methods.link && (
            <a
              href={methods.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-fit items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
            >
              Pay {total} with {methods.link.label}
              <ExternalLink aria-hidden className="size-4" />
            </a>
          )}
          {kind === "qr" && qrUrl && (
            <div className="grid justify-items-start gap-2 text-sm">
              <p>
                {methods.qr?.label ?? "Scan to pay"}. Enter {total} yourself.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element -- signed R2 URL */}
              <img
                src={qrUrl}
                alt={`${businessName} payment QR code`}
                className="size-44 rounded-md border object-contain p-1"
              />
            </div>
          )}
          {kind === "other" && methods.other && (
            <p className="text-sm leading-relaxed text-pretty whitespace-pre-line">
              {methods.other.instructions}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
