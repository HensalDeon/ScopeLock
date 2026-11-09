import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Faq, PRODUCT_FAQ } from "./faq";
import { GridBackdrop } from "./grid-backdrop";
import { PricingCards } from "./pricing";
import { Container, SectionHeading } from "./primitives";

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-16 border-b">
      <Container className="py-20 lg:py-28">
        <SectionHeading
          eyebrow="Pricing"
          title="Pays for itself with one approved change."
          intro="Start free. Upgrade when you're running more projects. Prices in rupees, GST extra where applicable."
        />
        <PricingCards className="mt-12" />
      </Container>
    </section>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-16 border-b">
      <Container className="grid gap-10 py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:py-28">
        <SectionHeading
          eyebrow="Questions"
          title="What people ask first."
          className="content-start self-start"
        />
        <Faq items={PRODUCT_FAQ} />
      </Container>
    </section>
  );
}

export function FinalCta() {
  return (
    <section>
      <Container className="py-20 lg:py-28">
        <div className="relative grid gap-8 overflow-hidden rounded-2xl border bg-canvas px-6 py-12 sm:px-12 sm:py-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <GridBackdrop />
          <div className="relative grid max-w-2xl gap-4">
            <h2 className="text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-[42px]">
              Your next &ldquo;small change&rdquo; is worth ₹12,000. Charge for
              it.
            </h2>
            <p className="text-[17px] text-muted-foreground">
              Free for 2 projects. No card needed.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="relative h-11 w-fit px-6 text-[15px]"
          >
            <Link href="/sign-up">Start free</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
