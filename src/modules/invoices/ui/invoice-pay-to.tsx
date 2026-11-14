import type { InvoicePayTo } from "../domain/snapshot";
import { Label } from "./invoice-parties";

/**
 * How to pay this invoice, as set up when it was issued: so the PDF an
 * accountant receives can be paid from, without opening the link.
 */
export function InvoicePayToBlock({ payTo }: { payTo: InvoicePayTo }) {
  const rows: [string, string][] = [
    ...(payTo.upi
      ? ([
          ["UPI ID", payTo.upi.vpa],
          ["UPI name", payTo.upi.payeeName],
        ] as [string, string][])
      : []),
    ...(payTo.bank
      ? ([
          ["Account name", payTo.bank.accountName],
          ["Account number", payTo.bank.accountNumber],
          ...(payTo.bank.ifsc ? [["IFSC", payTo.bank.ifsc]] : []),
          ["Bank", payTo.bank.bankName],
          ...(payTo.bank.swift ? [["SWIFT", payTo.bank.swift]] : []),
          ...(payTo.bank.iban ? [["IBAN", payTo.bank.iban]] : []),
        ] as [string, string][])
      : []),
    ...(payTo.link
      ? ([[payTo.link.label, payTo.link.url]] as [string, string][])
      : []),
  ];
  return (
    <section
      aria-label="Pay to"
      className="mt-8 grid [break-inside:avoid] gap-2"
    >
      <Label>Pay to</Label>
      <dl className="grid gap-x-6 gap-y-1 text-[0.85rem] @md:grid-cols-[9rem_minmax(0,1fr)]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-[#6b6f78]">{label}</dt>
            {/* Codes and numbers in mono; names and words in text. */}
            <dd
              className={
                /^(Account name|Bank|Name)$/.test(label)
                  ? "break-words"
                  : "font-mono break-all"
              }
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
