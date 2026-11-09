import { formatINR, rupeesToPaise, sum } from "@/shared/lib/money";
import { Container, Leader, SectionHeading } from "./primitives";

/** Landing page, section 1. The problem: small requests that add up. */

const rupees = (n: number) => formatINR(rupeesToPaise(n));

const SMALL_ASKS = [
  { ask: "Can we add one more page?", note: "Founder story", amount: 6_000 },
  { ask: "Make the logo animate on load", note: "Hero section", amount: 4_500 },
  { ask: "Add Razorpay, should be easy", note: "Checkout", amount: 18_000 },
  { ask: "Can it also be in Hindi?", note: "All pages", amount: 15_000 },
  { ask: "Small change: new colour scheme", note: "Site-wide", amount: 8_000 },
  { ask: "Export the enquiries to Excel", note: "Admin", amount: 7_000 },
];

export function SmallRequests() {
  const total = sum(SMALL_ASKS.map((a) => rupeesToPaise(a.amount)));
  return (
    <section className="border-b">
      <Container className="grid items-center gap-12 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:py-28">
        <SectionHeading
          eyebrow="The problem"
          title="It's never one big request. It's ten small ones."
          intro={
            <>
              Each one feels too small to invoice, so you just do it. By the end
              of the project you&apos;ve given away weeks of work, and nobody
              remembers who asked for what. ScopeLock prices each request the
              moment it comes in, while everyone still remembers it.
            </>
          }
        />

        <div className="rounded-xl border bg-canvas p-2">
          <div className="rounded-lg border bg-background px-5 py-5 sm:px-6">
            <div className="flex items-baseline justify-between gap-4 border-b border-dashed pb-3">
              <p className="font-mono text-[11.5px] tracking-[0.12em] text-muted-foreground uppercase">
                Done for free · Mehta Interiors
              </p>
              <p className="font-mono text-[11.5px] text-muted-foreground">
                Q3
              </p>
            </div>
            <ul className="grid gap-3 py-4">
              {SMALL_ASKS.map((item) => (
                <li key={item.ask} className="flex items-end text-[14.5px]">
                  <span className="min-w-0">
                    <span className="block">&ldquo;{item.ask}&rdquo;</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {item.note}
                    </span>
                  </span>
                  <Leader />
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {rupees(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between gap-4 border-t border-dashed pt-4">
              <p className="font-medium">Never billed</p>
              <p className="text-2xl font-semibold tracking-tight text-destructive tabular-nums">
                {formatINR(total)}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
