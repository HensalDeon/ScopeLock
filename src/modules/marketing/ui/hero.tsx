import { rupees, STORY, storyTotal } from "../domain/story";
import { Container, DISPLAY } from "./primitives";
import { ApprovalPlay } from "./approval-play";
import { SignUpStart } from "./sign-up-start";
import { Bubble, Log, LogDate, LogRow, LogTotal } from "./thread-log";

/**
 * The first screen: the question, then one client's thread kept as a log.
 * Rahul's two asks become CR-001; when that row comes into view its
 * "Waiting" gives way to "Approved" in one press and the total settles on
 * ₹95,000. Without JavaScript (or with reduced motion) the page simply shows
 * the approved state.
 */
export function Hero() {
  const c = STORY.change;
  return (
    <section className="border-b">
      <Container className="pt-10 pb-12 sm:pt-12 lg:pb-14 short:pt-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end lg:gap-16">
          <h1
            className={`${DISPLAY} max-w-[16ch] text-[46px] leading-[0.96] font-semibold sm:max-w-none sm:text-[64px] lg:text-[74px] short:text-[58px]`}
          >
            How much extra work did you do last month without charging?
          </h1>
          <p className="max-w-[46ch] text-[18px] leading-relaxed text-pretty text-muted-foreground lg:pb-1.5 short:text-[16px] short:leading-normal">
            For freelancers, studios and agencies in India. ScopeLock records
            what your client agreed to, turns every &ldquo;can you just
            add…&rdquo; into a priced change request, and gets it approved
            before you start the work.
          </p>
        </div>

        <ApprovalPlay>
          <Log
            className="mt-9 sm:mt-10 short:mt-6"
            label={`${STORY.company}: a client's requests, priced and approved`}
            heads={["Time", `${STORY.company} · ${STORY.project}`, "Amount"]}
            footer={
              <LogTotal label="Project total">
                <p
                  data-approval-total
                  className="sl-total grid grid-cols-[auto_auto] items-baseline justify-start gap-x-3 sm:justify-end"
                >
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
              billed={<span className="sl-pending">+ {rupees(c.amount)}</span>}
            >
              <ChangeLine />
            </LogRow>
          </Log>
        </ApprovalPlay>

        <SignUpStart id="hero-email" className="mt-8" />
      </Container>
    </section>
  );
}

/** CR-001 as it sits in the log: waiting, then approved in one press. */
function ChangeLine() {
  const c = STORY.change;
  return (
    <div
      data-approval-row
      className="flex max-w-[36rem] flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-foreground/80 bg-background px-4 py-3"
    >
      <p className="min-w-0 basis-full text-[15px] font-semibold sm:flex-1 sm:basis-auto sm:text-[16px]">
        <span className="mr-2 font-mono text-[11.5px] font-normal text-muted-foreground">
          {c.label}
        </span>{" "}
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
