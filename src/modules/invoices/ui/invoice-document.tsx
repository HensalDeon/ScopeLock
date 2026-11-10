import { formatDate } from "@/shared/lib/dates";
import { initialsOf } from "@/shared/lib/initials";
import { formatMoney, type Minor } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { GST_RATE_PERCENT } from "../domain/invoice";
import {
  lineDescription,
  type InvoiceSnapshot,
  type InvoiceStatus,
} from "../domain/snapshot";
import { amountInWords } from "../domain/words";
import { Label, Party } from "./invoice-parties";
import { InvoicePayToBlock } from "./invoice-pay-to";
import { InvoiceStatement } from "./invoice-statement";

const day = (iso: string) =>
  formatDate(new Date(`${iso}T12:00:00+05:30`), { withYear: true });

/**
 * An invoice as a printable A4 page, laid out with the fields CGST Rule 46
 * asks for. Plain on purpose: an invoice should read like an accounts
 * document, not a proposal. Pure presentation (app, portal and print).
 */
export function InvoiceDocument({
  invoice,
  status,
  logoUrl,
  accent,
  className,
  replacedBy = null,
}: {
  invoice: InvoiceSnapshot;
  status: InvoiceStatus;
  /** A cancelled invoice: the number of the one issued in its place. */
  replacedBy?: string | null;
  logoUrl: string | null;
  /** The workspace's document accent, for the top rule. */
  accent: string;
  className?: string;
}) {
  const money = (amount: Minor) => formatMoney(amount, invoice.currency);
  const { tax } = invoice;
  const half = GST_RATE_PERCENT / 2;

  return (
    <article
      className={cn(
        "@container border-t-4 bg-white px-6 py-8 text-[#1d1f24] [print-color-adjust:exact] sm:px-12 sm:py-10 print:px-[14mm]",
        className,
      )}
      style={{ borderTopColor: accent }}
    >
      {status === "cancelled" && (
        <div
          role="note"
          className="mb-8 grid gap-1 border-2 border-[#1d1f24] px-4 py-3 text-[#1d1f24]"
        >
          <p className="text-lg font-semibold tracking-[0.2em] uppercase">
            Cancelled
          </p>
          <p className="text-[0.85rem]">
            {replacedBy
              ? `Replaced by invoice ${replacedBy}. Nothing is owed on this one.`
              : "This invoice was cancelled. Nothing is owed on it."}
          </p>
        </div>
      )}
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex min-w-0 items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed R2 URL, already resized at upload
            <img
              src={logoUrl}
              alt={`${invoice.seller.company ?? invoice.seller.name} logo`}
              className="h-10 w-auto max-w-[8rem] object-contain"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-md border text-[12px] font-semibold"
            >
              {initialsOf(invoice.seller.company ?? invoice.seller.name)}
            </span>
          )}
          <p className="truncate text-lg font-semibold tracking-[-0.01em]">
            {invoice.seller.company ?? invoice.seller.name}
          </p>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">
            {invoice.title}
          </h1>
          <p className="mt-1 font-mono text-sm tabular-nums">
            {invoice.number}
          </p>
          {status !== "issued" && (
            <p
              className={cn(
                "mt-2 inline-block rounded border px-2 py-0.5 font-mono text-[11px] tracking-[0.14em] uppercase",
                status === "paid"
                  ? "border-emerald-700/30 text-emerald-800"
                  : "border-red-700/30 text-red-800",
              )}
            >
              {status === "paid" ? "Paid" : "Cancelled"}
            </p>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-6 @md:grid-cols-2">
        <Party label="From" party={invoice.seller} />
        <Party label="Billed to" party={invoice.buyer} />
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y py-4 text-[0.85rem] @md:grid-cols-4">
        <Meta label="Invoice date">{day(invoice.issuedOn)}</Meta>
        <Meta label="Due">On receipt</Meta>
        <Meta label="Project">{invoice.projectName}</Meta>
        {invoice.placeOfSupply ? (
          <Meta label="Place of supply">{invoice.placeOfSupply}</Meta>
        ) : invoice.export ? (
          <Meta label="Place of supply">
            Outside India ({invoice.export.country})
          </Meta>
        ) : (
          <Meta label="For">{invoice.paymentLabel}</Meta>
        )}
      </dl>

      <table className="mt-6 w-full border-collapse text-[0.9rem]">
        <thead>
          <tr className="border-b text-left text-[11px] tracking-[0.14em] text-[#6b6f78] uppercase">
            <th scope="col" className="w-8 py-2 font-medium">
              #
            </th>
            <th scope="col" className="py-2 font-medium">
              Description
            </th>
            <th scope="col" className="hidden py-2 font-medium @md:table-cell">
              SAC
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line, i) => (
            <tr key={i} className="border-b align-top">
              <td className="py-3 text-[#6b6f78] tabular-nums">{i + 1}</td>
              <td className="py-3 pr-4">
                <p className="text-pretty">
                  {lineDescription(line.description, invoice)}
                </p>
                <p className="text-xs text-[#6b6f78] @md:hidden">
                  SAC {line.sac}
                </p>
              </td>
              <td className="hidden py-3 font-mono text-[0.85rem] tabular-nums @md:table-cell">
                {line.sac}
              </td>
              <td className="py-3 text-right tabular-nums">
                {money(line.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-4 ml-auto grid max-w-xs gap-1.5 text-[0.9rem] tabular-nums">
        <Row label={tax.kind === "none" ? "Subtotal" : "Taxable value"}>
          {money(invoice.subtotal)}
        </Row>
        {tax.kind === "intra" && (
          <>
            <Row label={`CGST ${half}%`}>{money(tax.cgst)}</Row>
            <Row label={`SGST ${half}%`}>{money(tax.sgst)}</Row>
          </>
        )}
        {tax.kind === "inter" && (
          <Row label={`IGST ${GST_RATE_PERCENT}%`}>{money(tax.igst)}</Row>
        )}
        {tax.kind === "export" && (
          <Row label="IGST (zero-rated export)">{money(0 as Minor)}</Row>
        )}
        <div className="mt-1 flex justify-between gap-6 border-t pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd>{money(invoice.total)}</dd>
        </div>
      </dl>
      <p className="mt-2 ml-auto max-w-xs text-right text-[13px] text-pretty text-[#3a3d44]">
        {amountInWords(invoice.total, invoice.currency)}
      </p>

      {invoice.export && (
        <div className="mt-8 grid gap-1 rounded border px-4 py-3 text-[13px] leading-relaxed">
          <p className="font-semibold">{invoice.export.endorsement}</p>
          <p className="text-[#3a3d44]">
            LUT ARN {invoice.export.lutArn} · Country of destination{" "}
            {invoice.export.country}
          </p>
        </div>
      )}

      {invoice.statement && (
        <InvoiceStatement
          statement={invoice.statement}
          money={money}
          invoiceTotal={invoice.total}
        />
      )}

      {/* Pay-to and the signature print together, never a lone page. */}
      <div className="[break-inside:avoid]">
        {invoice.payTo && status !== "cancelled" && (
          <InvoicePayToBlock payTo={invoice.payTo} />
        )}

        <footer className="mt-10 grid gap-3 border-t pt-4 text-[13px] text-[#3a3d44] @md:grid-cols-[1fr_auto]">
          <div className="grid gap-1">
            {invoice.reverseCharge === false && (
              <p>Tax payable on reverse charge: No</p>
            )}
            {invoice.tax.kind === "none" && invoice.title === "Invoice" && (
              <p>
                The supplier isn&apos;t registered under GST, so no GST is
                charged.
              </p>
            )}
            <p>
              {invoice.paymentLabel} payment for {invoice.projectName}.
            </p>
          </div>
          <div className="@md:text-right">
            <Label>Authorised signatory</Label>
            {/* Room to sign a printed copy (Rule 46(q)). */}
            <div
              aria-hidden
              className="mt-2 h-12 w-48 border-b border-[#c9ccd2] @md:ml-auto"
            />
            <p className="mt-1 font-medium">{invoice.seller.name}</p>
          </div>
        </footer>
      </div>
    </article>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <dt>
        <Label>{label}</Label>
      </dt>
      <dd className="text-pretty">{children}</dd>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="text-[#3a3d44]">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
