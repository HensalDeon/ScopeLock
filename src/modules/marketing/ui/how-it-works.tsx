import { Check, QrCode } from "lucide-react";
import { formatINR, rupeesToPaise } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { Container, Leader, SectionHeading } from "./primitives";

/** Landing page, section 2. How it works. */

const rupees = (n: number) => formatINR(rupeesToPaise(n));

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-b bg-canvas">
      <Container className="py-20 lg:py-28">
        <SectionHeading
          eyebrow="How it works"
          title="From “can you just add…” to paid, in four steps."
        />
        <ol className="mt-14 grid gap-4 md:grid-cols-2">
          <StepCard
            n={1}
            title="Lock the scope"
            text="List what's included and the price. Your client approves it from a link, so the baseline is agreed in writing before work starts."
          >
            <ul className="grid gap-1.5 text-[13.5px]">
              {["Home", "About", "Services", "Gallery", "Contact"].map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Check className="size-3.5 text-brand" aria-hidden />
                  {p} page
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-baseline border-t pt-3 text-[13.5px]">
              <span className="text-muted-foreground">Approved 04 Nov</span>
              <Leader />
              <span className="font-semibold tabular-nums">
                {rupees(80_000)}
              </span>
            </p>
          </StepCard>

          <StepCard
            n={2}
            title="Log every extra request"
            text="When a request comes in on WhatsApp, a call or email, log it with a price in under a minute. Note where it came from."
          >
            <dl className="grid gap-2.5 text-[13.5px]">
              <MiniField label="What they asked for" value="Blog section" />
              <div className="grid grid-cols-2 gap-2.5">
                <MiniField label="Price" value={rupees(12_000)} mono />
                <MiniField label="Came from" value="WhatsApp" />
              </div>
            </dl>
          </StepCard>

          <StepCard
            n={3}
            title="Your client approves"
            text="They get one link: what changed, what it costs and when it's billed. No login, no app. Their answer is saved with the date and time."
          >
            <div className="grid gap-2 text-[13.5px]">
              <p className="flex items-baseline">
                <span>
                  <span className="mr-1.5 font-mono text-[11px] text-muted-foreground">
                    CR-004
                  </span>
                  Blog section
                </span>
                <Leader />
                <span className="font-semibold tabular-nums">
                  {rupees(12_000)}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <span className="flex h-8 items-center justify-center rounded-md bg-primary text-[13px] font-medium text-primary-foreground">
                  Approve
                </span>
                <span className="flex h-8 items-center justify-center rounded-md border bg-background text-[13px] font-medium">
                  Decline
                </span>
              </div>
            </div>
          </StepCard>

          <StepCard
            n={4}
            title="Get paid your way"
            text="Add it to the next milestone, the final payment, or ask for it now. Clients pay by UPI, bank transfer or your payment link."
          >
            <div className="flex items-center gap-3 text-[13.5px]">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-background">
                <QrCode className="size-7" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-medium">UPI QR with the amount filled in</p>
                <p className="text-muted-foreground">
                  Client pays, uploads the UTR, you confirm.
                </p>
              </div>
            </div>
          </StepCard>
        </ol>
      </Container>
    </section>
  );
}

function StepCard({
  n,
  title,
  text,
  children,
}: {
  n: number;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid content-start gap-5 rounded-xl border bg-background p-6 sm:p-7">
      <div className="grid gap-2">
        <p className="font-mono text-[12px] text-muted-foreground tabular-nums">
          Step {n}
        </p>
        <h3 className="text-xl font-semibold tracking-[-0.02em]">{title}</h3>
        <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {text}
        </p>
      </div>
      <div className="rounded-lg border bg-canvas p-4">{children}</div>
    </li>
  );
}

function MiniField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "rounded-md border bg-background px-2.5 py-1.5",
          mono && "tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
