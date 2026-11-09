import { formatINR, rupeesToPaise } from "@/shared/lib/money";
import { LogoMark } from "@/shared/ui/brand";
import { Container, Leader, SectionHeading } from "./primitives";

/** Landing page, section 3. What the client sees. */

const rupees = (n: number) => formatINR(rupeesToPaise(n));

export function ClientView() {
  return (
    <section className="border-b">
      <Container className="grid items-center gap-14 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20 lg:py-28">
        <div className="grid gap-8">
          <SectionHeading
            eyebrow="For your client"
            title="One link on WhatsApp. One tap to approve."
            intro="Your client sees your business, not ours: what they asked for, why it's extra, what it costs and when it's billed. Clear enough that saying yes feels normal."
          />
          <dl className="grid gap-5 border-t pt-6 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              [
                "No login",
                "Clients open the link and decide. Nothing to install.",
              ],
              ["Your branding", "Your business name and logo at the top."],
              [
                "On the record",
                "Every answer is saved with the time it was given.",
              ],
            ].map(([term, detail]) => (
              <div key={term} className="grid gap-1">
                <dt className="text-[15px] font-medium">{term}</dt>
                <dd className="text-sm leading-relaxed text-muted-foreground">
                  {detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex justify-center">
          <PhoneApproval />
        </div>
      </Container>
    </section>
  );
}

function PhoneApproval() {
  return (
    <div
      aria-label="The approval page your client sees on their phone"
      role="img"
      className="w-full max-w-[19.5rem] rounded-[2.6rem] border bg-canvas p-2.5 shadow-[0_30px_80px_-30px_rgba(11,18,32,0.35)]"
    >
      <div className="overflow-hidden rounded-[2.1rem] border bg-background">
        <div className="flex justify-center pt-2.5 pb-1">
          <span className="h-1.5 w-16 rounded-full bg-border" />
        </div>
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-md bg-brand-ink text-[12px] font-semibold text-white">
            PC
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium">
              Pixel &amp; Code Studio
            </p>
            <p className="text-[12px] text-muted-foreground">
              Website redesign · Mehta Interiors
            </p>
          </div>
        </div>
        <div className="grid gap-4 px-5 py-5">
          <div className="grid gap-1">
            <p className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
              Change request CR-004
            </p>
            <p className="text-[19px] font-semibold tracking-tight">
              Blog section
            </p>
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            A blog with categories and 3 starter posts. Not part of the original
            5-page agreement you approved on 04 Nov.
          </p>
          <dl className="grid gap-2 rounded-lg bg-canvas p-3 text-[13px]">
            <div className="flex items-baseline">
              <dt className="text-muted-foreground">Price</dt>
              <Leader />
              <dd className="font-semibold tabular-nums">{rupees(12_000)}</dd>
            </div>
            <div className="flex items-baseline">
              <dt className="text-muted-foreground">Billed with</dt>
              <Leader />
              <dd>Final payment</dd>
            </div>
          </dl>
          <div className="grid gap-2">
            <span className="flex h-11 items-center justify-center rounded-lg bg-primary text-[14px] font-medium text-primary-foreground">
              Approve {rupees(12_000)}
            </span>
            <span className="flex h-11 items-center justify-center rounded-lg border text-[14px] font-medium">
              Decline
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 border-t bg-canvas py-2.5 text-[11px] text-muted-foreground">
          Powered by
          <LogoMark title="" className="size-3" />
          <span className="font-medium tracking-tight text-foreground">
            scopelock
          </span>
        </div>
      </div>
    </div>
  );
}
