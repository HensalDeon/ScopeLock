import { Check } from "lucide-react";
import { formatINR, rupeesToPaise } from "@/shared/lib/money";
import { Container, SectionHeading } from "./primitives";

/** Landing page, section 4. Payments. */

const rupees = (n: number) => formatINR(rupeesToPaise(n));

const MILESTONES = [
  { name: "Upfront", pct: 30, base: 24_000, extra: 0, state: "paid" },
  { name: "Mid-development", pct: 30, base: 24_000, extra: 0, state: "paid" },
  { name: "Before launch", pct: 40, base: 32_000, extra: 15_000, state: "due" },
] as const;

export function Payments() {
  return (
    <section className="border-b bg-canvas">
      <Container className="grid items-center gap-14 py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14 lg:py-28">
        <div className="grid gap-8">
          <SectionHeading
            eyebrow="Payments"
            title="Approved today. Paid when your terms say."
            intro="Work in 30/30/40 milestones? Approved changes join the milestone you choose, so the final invoice already has the client's yes behind every line."
          />
          <ul className="grid gap-3 border-t pt-6 text-[15px]">
            {[
              "UPI ID, QR code, bank transfer or your own payment link",
              "Clients upload the UTR; only you can mark it received",
              "Money goes straight to you. ScopeLock never holds it",
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <Check
                  className="mt-1 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="text-pretty">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative overflow-x-auto rounded-xl border bg-background">
          <table className="w-full text-left text-[13px] sm:min-w-[30rem] sm:text-[14px]">
            <caption className="border-b px-3 py-4 text-left sm:px-5">
              <span className="font-medium">Website redesign</span>
              <span className="text-muted-foreground"> · Mehta Interiors</span>
            </caption>
            <thead>
              <tr className="border-b text-[12px] text-muted-foreground">
                <th scope="col" className="px-3 py-2.5 font-normal sm:px-5">
                  Milestone
                </th>
                <th
                  scope="col"
                  className="px-1.5 py-2.5 text-right font-normal sm:px-3"
                >
                  Agreed
                </th>
                <th
                  scope="col"
                  className="px-1.5 py-2.5 text-right font-normal sm:px-3"
                >
                  Changes
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-right font-normal sm:px-5"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {MILESTONES.map((m) => (
                <tr key={m.name} className="border-b last:border-b-0">
                  <td className="px-3 py-3.5 sm:px-5 sm:whitespace-nowrap">
                    {m.name}
                    <span className="ml-1.5 text-muted-foreground tabular-nums">
                      {m.pct}%
                    </span>
                  </td>
                  <td className="px-1.5 py-3.5 text-right whitespace-nowrap tabular-nums sm:px-3">
                    {rupees(m.base)}
                  </td>
                  <td className="px-1.5 py-3.5 text-right whitespace-nowrap tabular-nums sm:px-3">
                    {m.extra ? (
                      <span className="font-medium text-success-ink">
                        +{rupees(m.extra)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-right sm:px-5 sm:whitespace-nowrap">
                    {m.state === "paid" ? (
                      <span className="text-muted-foreground">Paid</span>
                    ) : (
                      <span className="font-semibold tabular-nums">
                        {rupees(m.base + m.extra)} due
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-canvas text-[13px]">
                <td
                  className="px-3 py-3 text-muted-foreground sm:px-5"
                  colSpan={2}
                >
                  Extras: blog section + WhatsApp button, both approved
                </td>
                <td
                  className="px-3 py-3 text-right font-medium sm:px-5"
                  colSpan={2}
                >
                  Project total{" "}
                  <span className="tabular-nums">{rupees(95_000)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Container>
    </section>
  );
}
