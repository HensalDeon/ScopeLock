import { Check, QrCode } from "lucide-react";
import { formatINR, paise, sum } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { LogoMark } from "@/shared/ui/brand";
import { Container, Leader, SectionHeading } from "./primitives";

const rupees = (n: number) => formatINR(paise(n * 100));

/* ── 1. The problem ─────────────────────────────────────────────────────── */

const SMALL_ASKS = [
  { ask: "Can we add one more page?", note: "Founder story", amount: 6_000 },
  { ask: "Make the logo animate on load", note: "Hero section", amount: 4_500 },
  { ask: "Add Razorpay, should be easy", note: "Checkout", amount: 18_000 },
  { ask: "Can it also be in Hindi?", note: "All pages", amount: 15_000 },
  { ask: "Small change: new colour scheme", note: "Site-wide", amount: 8_000 },
  { ask: "Export the enquiries to Excel", note: "Admin", amount: 7_000 },
];

export function SmallRequests() {
  const total = sum(SMALL_ASKS.map((a) => paise(a.amount * 100)));
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
                    <span className="block text-[12.5px] text-muted-foreground">
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

/* ── 2. How it works ────────────────────────────────────────────────────── */

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

/* ── 3. What the client sees ────────────────────────────────────────────── */

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
            <div className="flex items-baseline">
              <dt className="text-muted-foreground">Ready by</dt>
              <Leader />
              <dd>+4 working days</dd>
            </div>
          </dl>
          <div className="grid gap-2">
            <span className="flex h-11 items-center justify-center rounded-lg bg-primary text-[14px] font-medium text-primary-foreground">
              Approve {rupees(12_000)}
            </span>
            <span className="flex h-11 items-center justify-center rounded-lg border text-[14px] font-medium">
              Not now
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

/* ── 4. Payments ────────────────────────────────────────────────────────── */

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
                  className="mt-1 size-4 shrink-0 text-brand"
                  aria-hidden
                />
                <span className="text-pretty">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative overflow-x-auto rounded-xl border bg-background">
          <table className="w-full min-w-[30rem] text-left text-[14px]">
            <caption className="border-b px-5 py-4 text-left">
              <span className="font-medium">Website redesign</span>
              <span className="text-muted-foreground"> · Mehta Interiors</span>
            </caption>
            <thead>
              <tr className="border-b text-[12px] text-muted-foreground">
                <th scope="col" className="px-5 py-2.5 font-normal">
                  Milestone
                </th>
                <th scope="col" className="px-3 py-2.5 text-right font-normal">
                  Agreed
                </th>
                <th scope="col" className="px-3 py-2.5 text-right font-normal">
                  Changes
                </th>
                <th scope="col" className="px-5 py-2.5 text-right font-normal">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {MILESTONES.map((m) => (
                <tr key={m.name} className="border-b last:border-b-0">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {m.name}
                    <span className="ml-1.5 text-muted-foreground tabular-nums">
                      {m.pct}%
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right whitespace-nowrap tabular-nums">
                    {rupees(m.base)}
                  </td>
                  <td className="px-3 py-3.5 text-right whitespace-nowrap tabular-nums">
                    {m.extra ? (
                      <span className="font-medium text-brand">
                        +{rupees(m.extra)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
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
                <td className="px-5 py-3 text-muted-foreground" colSpan={2}>
                  Extras: blog section + WhatsApp button, both approved
                </td>
                <td className="px-5 py-3 text-right font-medium" colSpan={2}>
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

/* ── 5. The record ──────────────────────────────────────────────────────── */

export function Evidence() {
  return (
    <section className="bg-brand-ink text-[#e8ecf2]">
      <Container className="grid items-center gap-14 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:py-28">
        <SectionHeading
          invert
          eyebrow="The record"
          title={<>When they say &ldquo;that was included&rdquo;</>}
          intro="Every approval is stored exactly as the client saw it, with who approved it and when. Download one PDF with the original deal, every change, every approval and every payment."
        />

        <div className="rounded-xl border border-white/[0.08] bg-[#111a2c] p-5 font-mono text-[12.5px] leading-[1.9] sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
            <span className="text-[#8b95a7]">Approval record</span>
            <span className="inline-flex items-center gap-1.5 text-brand-bright">
              <LogoMark title="" className="size-3 text-brand-bright" />
              locked
            </span>
          </div>
          <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
            {[
              ["request", "CR-004 · Blog section"],
              ["amount", rupees(12_000)],
              ["decision", "approved"],
              ["approved_by", "Rahul Mehta"],
              ["email", "rahul@mehtainteriors.in"],
              ["approved_at", "18 Nov 2026, 3:42:07 pm IST"],
              ["device", "Android · Chrome"],
              ["fingerprint", "sha256:7f3a…e91c"],
            ].map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-[#6f7b8f]">{k}</dt>
                <dd
                  className={cn(
                    "truncate text-[#e8ecf2]",
                    k === "decision" && "text-brand-bright",
                  )}
                >
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
