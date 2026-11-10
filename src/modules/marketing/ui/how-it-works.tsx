import { rupees, STORY, storyTotal } from "../domain/story";
import { ClientApproval } from "./client-view";
import { PaymentLedger } from "./payments-story";
import { Container, DISPLAY, SectionHeading } from "./primitives";
import { ChangeOrderOnDesk, ProposalOnDesk } from "./story-documents";
import { Bubble } from "./thread-log";

/**
 * How it works: the same project, day by day. The date runs down the left
 * gutter like the hero's log; each day shows what ScopeLock made.
 */
export function HowItWorks() {
  const c = STORY.change;
  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 overflow-x-clip border-b"
    >
      <Container className="py-20 lg:py-28">
        <SectionHeading
          title="From “can you just add…” to paid, in four steps."
          intro="An example project, day by day. The proposal and change order below are the documents ScopeLock makes, as the client sees them."
        />
        <ol className="mt-14">
          <Day
            date={STORY.agreedOn}
            title="Lock the scope"
            figure={{ amount: rupees(STORY.agreed), label: "agreed" }}
            text="List what's included and the price, and ScopeLock turns it into a proposal in your brand. Your client approves it from a link, so the baseline is agreed in writing before work starts."
          >
            <ProposalOnDesk />
          </Day>
          <Day
            date={c.askedOn}
            time={c.sentAt}
            title="Price every extra request"
            figure={{
              amount: `+ ${rupees(c.amount)}`,
              label: `${c.label}, sent`,
            }}
            text="When a request comes in on WhatsApp, a call or email, log it with a price in under a minute. Each one gets a number (CR-001, CR-002…), and your client gets a change order: what changed, what it costs, which payment it joins."
          >
            <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
              <div className="grid content-start gap-2 self-start max-sm:hidden lg:sticky lg:top-24">
                {STORY.asks.map((a) => (
                  <div key={a.at} className="grid gap-1">
                    <span className="font-mono text-[12px] text-muted-foreground tabular-nums">
                      {STORY.clientFirst}, {a.at}
                    </span>
                    <Bubble>{a.text}</Bubble>
                  </div>
                ))}
                <div className="mt-3 grid justify-items-end gap-1">
                  <span className="font-mono text-[12px] text-muted-foreground tabular-nums">
                    You, {c.sentAt}
                  </span>
                  <Bubble from="you">
                    Happy to add both. Here&apos;s the price; you can approve it
                    from this link.{" "}
                    <span className="underline underline-offset-3">
                      {c.label} · {STORY.change.title}
                    </span>
                  </Bubble>
                </div>
              </div>
              <ChangeOrderOnDesk />
            </div>
          </Day>
          <Day
            date={c.askedOn}
            time={c.approvedAt}
            title={`${STORY.clientFirst} approves from his phone`}
            figure={{ amount: rupees(storyTotal()), label: "project total" }}
            text="One link, usually on WhatsApp. No login, no app. His answer is saved as a signed record with the date and time."
          >
            <ClientApproval />
          </Day>
          <Day
            date={STORY.milestones[2].paidOn}
            title="Get paid on your terms"
            figure={{ amount: rupees(storyTotal()), label: "all received" }}
            text="Approving and paying are separate. Each change joins the next payment, the final one, a payment you choose, or is paid on its own. With a GSTIN, every payment you ask for comes with a GST invoice."
          >
            <PaymentLedger />
          </Day>
        </ol>
      </Container>
    </section>
  );
}

function Day({
  date,
  time,
  title,
  text,
  figure,
  children,
}: {
  date: string;
  time?: string;
  title: string;
  text: string;
  /** The log's billed figure, moving with the story. */
  figure: { amount: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 gap-y-8 border-t py-12 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-x-6 sm:gap-y-10 sm:py-16">
      <p className="pt-2 font-mono text-[12px] text-muted-foreground tabular-nums sm:sticky sm:top-24 sm:self-start">
        <span className="block">{date}</span>
        {time && <span className="block">{time}</span>}
      </p>
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_11rem] lg:gap-x-12">
        <h3
          className={`${DISPLAY} text-[30px] leading-[1] font-semibold sm:text-[36px]`}
        >
          {title}
        </h3>
        <p className="max-w-[58ch] text-[16px] leading-relaxed text-pretty text-muted-foreground lg:pt-1.5">
          {text}
        </p>
        <p className="grid content-start gap-0.5 border-t pt-3 lg:border-t-0 lg:pt-1 lg:text-right">
          <span className="text-[22px] leading-none font-semibold tracking-[-0.02em] tabular-nums">
            {figure.amount}
          </span>
          <span className="text-[13px] text-muted-foreground">
            {figure.label}
          </span>
        </p>
      </div>
      <div className="col-span-full min-w-0 sm:col-start-2">{children}</div>
    </li>
  );
}
