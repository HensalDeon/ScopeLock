import Link from "next/link";
import { planById, type Plan } from "@/modules/billing";
import { coverage } from "../domain/pricing-copy";
import { rupees, STORY } from "../domain/story";
import { Faq, productFaq } from "./faq";
import { RateCard } from "./pricing";
import { Container, DISPLAY, SectionHeading } from "./primitives";
import { SignUpStart } from "./sign-up-start";
import { Bubble, Log, LogRow } from "./thread-log";

export function PricingSection({
  plans,
  paidOpen = false,
}: {
  plans: readonly Plan[];
  /** Paid plans can be bought now (Razorpay is set up). */
  paidOpen?: boolean;
}) {
  const pro = planById(plans, "pro");
  const covers = pro
    ? coverage(STORY.change.amount * 100, pro.monthlyPrice)
    : "";
  const lead = covers
    ? `Rahul's ${rupees(STORY.change.amount)} change alone would cover ${covers} of ${pro?.name}. `
    : "";
  return (
    <section id="pricing" className="scroll-mt-16 border-b">
      <Container className="py-20 lg:py-28">
        <SectionHeading
          title="Pays for itself with one approved change."
          intro={`${lead}${paidOpen ? "Start free; upgrade from Settings when you need more." : "Paid plans open at launch; until then everyone starts on Free."} Prices in rupees, GST extra where applicable.`}
        />
        <RateCard plans={plans} className="mt-12" paidOpen={paidOpen} />
        <Link
          href="/pricing"
          className="mt-6 inline-flex min-h-11 items-center text-[15px] font-medium underline underline-offset-4"
        >
          Compare plans in detail
        </Link>
      </Container>
    </section>
  );
}

/** "Rahul's ₹15,000 change alone would cover over two years of Pro." */
export function pricingProof(plans: readonly Plan[]): string {
  const pro = planById(plans, "pro");
  const covers = pro
    ? coverage(STORY.change.amount * 100, pro.monthlyPrice)
    : "";
  return covers
    ? `Rahul's ${rupees(STORY.change.amount)} change alone would cover ${covers} of ${pro?.name}.`
    : "";
}

export function FaqSection({ paidOpen = false }: { paidOpen?: boolean }) {
  return (
    <section id="faq" className="scroll-mt-16 border-b">
      <Container className="grid gap-10 py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:py-28">
        <div className="grid content-start gap-5 self-start lg:sticky lg:top-24">
          <SectionHeading title="What people ask first." />
          <p className="text-[15px] text-muted-foreground">
            Something else?{" "}
            <Link
              href="/contact"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Ask us directly
            </Link>
            .
          </p>
        </div>
        <Faq items={productFaq(paidOpen)} />
      </Container>
    </section>
  );
}

/** The thread's next line is yours: the page ends where the work starts. */
export function FinalCta({ formId = "close-email" }: { formId?: string }) {
  return (
    <section>
      <Container className="py-20 lg:py-28">
        <h2
          className={`${DISPLAY} max-w-[20ch] text-[36px] leading-[1] font-semibold sm:text-[50px]`}
        >
          Your next &ldquo;small change&rdquo; is worth{" "}
          <span className="font-sans text-[0.92em] tracking-[-0.03em] [font-stretch:100%] tabular-nums">
            {rupees(STORY.change.amount)}
          </span>
          . Charge for it.
        </h2>
        <Log
          className="mt-10"
          label="Your next request"
          heads={["Time", "Your next project", "Amount"]}
        >
          <LogRow
            time="Today"
            who="Your client"
            billed={
              <span className="text-muted-foreground">
                + {rupees(STORY.change.amount)}
                <span className="block text-[12px]">once you price it</span>
              </span>
            }
          >
            <Bubble>Can you just add one more thing? Should be quick.</Bubble>
          </LogRow>
          <LogRow time="Today" who="You">
            <SignUpStart id={formId} />
          </LogRow>
        </Log>
      </Container>
    </section>
  );
}
