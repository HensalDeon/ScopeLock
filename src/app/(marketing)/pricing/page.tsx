import type { Metadata } from "next";
import Link from "next/link";
import { isBillingConfigured } from "@/shared/lib/env";
import {
  ComparePlans,
  Container,
  Faq,
  FinalCta,
  pricingDescription,
  pricingProof,
  SignUpStart,
  RateCard,
  SectionHeading,
  type FaqItem,
} from "@/modules/marketing";
import { getPlans } from "@/modules/billing/server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Pricing",
    description: pricingDescription(await getPlans()),
    alternates: { canonical: "/pricing" },
  };
}

const billingFaq = (paidOpen: boolean): FaqItem[] => [
  {
    q: "What counts as an active project?",
    a: "Any project that isn't archived. Archive a project when it's finished and paid; it stays readable and downloadable, and stops counting towards your limit.",
  },
  {
    q: "How do I pay for ScopeLock?",
    a: paidOpen
      ? "Monthly through Razorpay, by UPI, card or net banking, from Settings → Plan & usage. Razorpay emails a receipt for every payment."
      : "There's nothing to pay yet: paid plans aren't open. When they open, you'll pay monthly by UPI, card or net banking, with an invoice for every payment.",
  },
  {
    q: "What happens if I go over my plan's limit?",
    a: "Nothing breaks. You can't start a new project until you archive one or upgrade. Existing projects keep working for you and your clients.",
  },
  {
    q: "Can I switch plans later?",
    a: paidOpen
      ? "Yes, from Settings → Plan & usage. Moving up applies straight away; moving down or cancelling applies from your next billing date."
      : "Yes, once paid plans open. Upgrades will apply straight away, downgrades from your next billing date.",
  },
];

export default async function PricingPage() {
  const plans = await getPlans();
  const paidOpen = isBillingConfigured();
  return (
    <>
      <section className="border-b">
        <Container className="py-16 sm:py-20">
          <SectionHeading
            as="h1"
            title="Pays for itself with one approved change."
            intro={`${pricingProof(plans)} ${
              paidOpen
                ? "Start free on your next project and upgrade from Settings when you need more."
                : "Start free on your next project. Pro and Agency are planned prices; paid plans aren't open yet, so everyone starts on Free."
            } Prices in Indian rupees; GST extra where applicable.`}
          />
          <RateCard
            plans={plans}
            className="mt-12"
            planHeading="h2"
            paidOpen={paidOpen}
          />
          <SignUpStart id="pricing-start" className="mt-10 max-w-xl" />
        </Container>
      </section>

      <ComparePlans plans={plans} />

      <section className="border-b">
        <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div className="grid content-start gap-5 self-start lg:sticky lg:top-24">
            <SectionHeading title="Plans and payments." />
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
          <Faq items={billingFaq(paidOpen)} />
        </Container>
      </section>

      <FinalCta />
    </>
  );
}
