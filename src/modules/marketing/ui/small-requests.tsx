import { formatINR } from "@/shared/lib/money";
import { FREE_ASKS, neverBilled, rupees } from "../domain/story";
import { Container, SectionHeading } from "./primitives";
import { Bubble, Log, LogRow, LogTotal } from "./thread-log";

/** The problem, as a log of the last project: small asks, done for free. */
export function SmallRequests() {
  return (
    <section className="border-b">
      <Container className="py-20 lg:py-28">
        <SectionHeading
          title="It's never one big request. It's ten small ones."
          intro="Each one feels too small to invoice, so you just do it. By the end of the project you've given away weeks of work, and nobody remembers who asked for what."
        />
        <Log
          className="mt-12"
          label="Requests from the last project, done for free"
          heads={["Date", "Your last project, on WhatsApp", "Amount"]}
          footer={
            <LogTotal label="Never billed">
              <p className="text-[26px] leading-none font-semibold tracking-[-0.02em] tabular-nums">
                {formatINR(neverBilled())}
              </p>
            </LogTotal>
          }
        >
          {FREE_ASKS.map((a) => (
            <LogRow
              key={a.ask}
              time={a.on}
              ghost
              billed={
                <>
                  <span className="line-through decoration-1">
                    {rupees(a.amount)}
                  </span>
                  <span className="ml-2 text-[12px] no-underline">free</span>
                </>
              }
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Bubble className="max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent max-sm:p-0">
                  &ldquo;{a.ask}&rdquo;
                </Bubble>
                <span className="text-[12px] text-muted-foreground max-sm:hidden">
                  {a.note}
                </span>
              </div>
            </LogRow>
          ))}
        </Log>
      </Container>
    </section>
  );
}
