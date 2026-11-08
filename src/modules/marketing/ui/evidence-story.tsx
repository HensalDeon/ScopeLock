import { formatINR, rupeesToPaise } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { LogoMark } from "@/shared/ui/brand";
import { Container, SectionHeading } from "./primitives";

/** Landing page, section 5. The record. */

const rupees = (n: number) => formatINR(rupeesToPaise(n));

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
