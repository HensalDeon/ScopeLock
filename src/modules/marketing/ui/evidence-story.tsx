import { cn } from "@/shared/lib/utils";
import { LogoMark } from "@/shared/ui/brand";
import { rupees, STORY } from "../domain/story";
import { Container, DISPLAY, SectionHeading } from "./primitives";
import { SignUpStart } from "./sign-up-start";
import { Bubble } from "./thread-log";

/** The last entry in the thread: the dispute, and the record that ends it. */
export function Evidence() {
  const c = STORY.change;
  return (
    <section className="bg-brand-ink text-[#e8ecf2]">
      <Container className="py-20 lg:py-28">
        <SectionHeading
          invert
          title={<>When they say &ldquo;that was included&rdquo;</>}
          intro="Every answer is saved exactly as the client saw it, with who answered and when, and checked against its signature every time it's opened."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-12">
          <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 border-t border-white/15 pt-4 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-x-6">
            <span className="pt-1 font-mono text-[12px] text-[#8d99ad] tabular-nums">
              {STORY.disputeOn}
            </span>
            <div className="grid gap-2">
              <span className="text-[12px] text-[#8d99ad]">
                {STORY.clientFirst}
              </span>
              <Bubble className="border-white/10 bg-white/[0.06] text-[#e8ecf2]">
                Can the blog be in Hindi too? That was part of it, no?
              </Bubble>
              <span className="mt-3 text-[12px] text-[#8d99ad]">You</span>
              <Bubble
                from="you"
                className="border-white/25 bg-transparent text-[#e8ecf2]"
              >
                Here&apos;s what {c.label} covered: categories, search and 3
                starter posts, approved {c.askedOn} at {c.approvedAt}. Hindi
                would be a new change.
              </Bubble>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#111a2c] p-5 font-mono text-[12px] leading-[1.9] sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
              <span className="text-[#8b95a7]">Signed record</span>
              <span className="inline-flex items-center gap-1.5 text-brand-bright">
                <LogoMark title="" className="size-3 text-brand-bright" />
                intact
              </span>
            </div>
            <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
              {[
                ["request", `${c.label} · ${c.title}`],
                ["amount", rupees(c.amount)],
                ["billed with", c.billedWith],
                ["decision", "approved"],
                ["approved by", STORY.client],
                ["email", STORY.clientEmail],
                ["approved at", `${c.askedOn} 2026, ${c.approvedAt} IST`],
                ["device", "Android · Chrome"],
                ["fingerprint", "sha256:7f3a…e91c"],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-[#8d99ad]">{k}</dt>
                  <dd
                    className={cn(
                      "break-words text-[#e8ecf2]",
                      k === "decision" && "text-brand-bright",
                    )}
                  >
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-white/[0.07] pt-3 font-sans text-[13px] leading-relaxed text-[#a3adbd]">
              The fingerprint changes if even one character of the record
              changes, and ScopeLock checks it every time the record is opened.
            </p>
          </div>
        </div>
        <div className="mt-14 grid gap-5 border-t border-white/15 pt-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
          <p
            className={`${DISPLAY} max-w-[24ch] text-[30px] leading-[1.05] font-semibold text-white`}
          >
            Keep a record like this for every extra your clients ask for.
          </p>
          <SignUpStart id="record-email" invert />
        </div>
      </Container>
    </section>
  );
}
