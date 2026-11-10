import Link from "next/link";
import { rupees, STORY } from "../domain/story";
import { Faq, PRODUCT_FAQ } from "./faq";
import { RateCard } from "./pricing";
import { Container, SectionHeading } from "./primitives";
import { SignUpStart } from "./sign-up-start";

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-16 border-b">
      <Container className="py-20 lg:py-28">
        <SectionHeading
          title="Pays for itself with one approved change."
          intro={`Rahul's ${rupees(STORY.change.amount)} change alone would cover over two years of Pro. Paid plans open at launch; until then everyone starts on Free. Prices in rupees, GST extra where applicable.`}
        />
        <RateCard className="mt-12" />
      </Container>
    </section>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-16 border-b">
      <Container className="grid gap-10 py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:py-28">
        <div className="grid content-start gap-5 self-start">
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
        <Faq items={PRODUCT_FAQ} />
      </Container>
    </section>
  );
}

/** The thread's next line is yours: the page ends where the work starts. */
export function FinalCta({ formId = "close-email" }: { formId?: string }) {
  return (
    <section>
      <Container className="py-20 lg:py-28">
        <div className="grid gap-x-6 gap-y-4 border-t border-foreground pt-6 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
          <span className="pt-2 font-mono text-[12px] text-muted-foreground">
            Today
          </span>
          <div className="grid gap-8">
            <h2 className="max-w-[22ch] text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-[42px]">
              Your next &ldquo;small change&rdquo; is worth{" "}
              {rupees(STORY.change.amount)}. Charge for it.
            </h2>
            <SignUpStart id={formId} />
          </div>
        </div>
      </Container>
    </section>
  );
}
