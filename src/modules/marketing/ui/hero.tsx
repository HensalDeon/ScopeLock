import { rupees, STORY, storyTotal } from "../domain/story";
import { Container } from "./primitives";
import { SignUpStart } from "./sign-up-start";
import { Bubble, Log, LogDate, LogRow, LogTotal } from "./thread-log";

/**
 * The first screen: the question, then one client's thread kept as a log.
 * Rahul's two asks become CR-001; on first view its "Waiting" gives way to
 * "Approved" in one press and the total settles on ₹95,000. Without motion,
 * the page simply shows the approved state.
 */
export function Hero() {
  const c = STORY.change;
  return (
    <section className="border-b">
      <Container className="pt-10 pb-12 sm:pt-12 lg:pb-14">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end lg:gap-16">
          <h1 className="max-w-[15ch] text-[40px] leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:max-w-none sm:text-[56px] lg:text-[62px]">
            How much extra work did you do last month without charging?
          </h1>
          <p className="max-w-[46ch] text-[18px] leading-relaxed text-pretty text-muted-foreground lg:pb-1.5">
            ScopeLock records what your client agreed to, turns every &ldquo;can
            you just add…&rdquo; into a priced change request, and gets it
            approved before you start the work.
          </p>
        </div>

        <Log
          className="mt-9 sm:mt-10"
          label={`${STORY.company}: a client's requests, priced and approved`}
          heads={["Time", `${STORY.company} · ${STORY.project}`, "Billed"]}
          footer={
            <LogTotal label={`Project total, with ${STORY.clientFirst}'s yes`}>
              <p className="flex items-baseline gap-3 sm:justify-end">
                <span className="sl-strike text-[16px] text-muted-foreground tabular-nums">
                  <span className="sr-only">was </span>
                  {rupees(STORY.agreed)}
                </span>
                <span className="sl-settle text-[26px] leading-none font-semibold tracking-[-0.02em] tabular-nums">
                  <span className="sr-only">now </span>
                  {rupees(storyTotal())}
                </span>
              </p>
            </LogTotal>
          }
        >
          <LogRow
            time={STORY.agreedOn}
            who="Agreed scope"
            ghost
            billed={rupees(STORY.agreed)}
          >
            <p className="text-[15px] text-pretty sm:text-[16px]">
              {STORY.pages.join(", ")}. Paid 30/30/40.
            </p>
          </LogRow>
          <LogDate>{c.askedOn}</LogDate>
          {STORY.asks.map((a) => (
            <LogRow key={a.at} time={a.at} who={STORY.clientFirst}>
              <Bubble>{a.text}</Bubble>
            </LogRow>
          ))}
          <LogRow
            time={c.sentAt}
            who="You"
            strong
            billed={`+ ${rupees(c.amount)}`}
          >
            <ChangeLine />
          </LogRow>
        </Log>

        <SignUpStart id="hero-email" className="mt-8" />
      </Container>
    </section>
  );
}

/** CR-001 as it sits in the log: waiting, then approved in one press. */
function ChangeLine() {
  const c = STORY.change;
  return (
    <div className="flex max-w-[36rem] flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-foreground/80 bg-background px-4 py-3">
      <p className="min-w-0 basis-full text-[15px] font-semibold sm:flex-1 sm:basis-auto sm:text-[16px]">
        <span className="mr-2 font-mono text-[11.5px] font-normal text-muted-foreground">
          {c.label}
        </span>
        {c.title}
      </p>
      <span className="grid">
        <span
          aria-hidden
          className="sl-wait col-start-1 row-start-1 inline-flex h-6 items-center gap-1.5 rounded-full bg-warning-soft px-2.5 text-[12px] font-medium text-warning-ink"
        >
          <span className="size-1.5 rounded-full bg-warning" />
          Waiting for {STORY.clientFirst}
        </span>
        <span className="sl-stamp col-start-1 row-start-1 inline-flex h-6 items-center gap-1.5 rounded-full bg-success-soft px-2.5 text-[12px] font-medium">
          <span className="size-1.5 rounded-full bg-brand" />
          Approved {c.approvedAt}
        </span>
      </span>
    </div>
  );
}
