import type { Metadata } from "next";
import {
  ComparePlans,
  Container,
  Faq,
  FinalCta,
  pricingDescription,
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

const BILLING_FAQ: FaqItem[] = [
  {
    q: "What counts as an active project?",
    a: "Any project that isn't archived. Archive a project when it's finished and paid; it stays readable and downloadable, and stops counting towards your limit.",
  },
  {
    q: "How do I pay for ScopeLock?",
    a: "There's nothing to pay yet: paid plans aren't open. When they open, you'll pay monthly by UPI, card or net banking, with a GST invoice for every payment.",
  },
  {
    q: "What happens if I go over my plan's limit?",
    a: "Nothing breaks. You can't start a new project until you archive one or upgrade. Existing projects keep working for you and your clients.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes, once paid plans open. Upgrades will apply straight away, downgrades from your next billing date.",
  },
];

export default async function PricingPage() {
  const plans = await getPlans();
  return (
    <>
      <section className="border-b">
        <Container className="py-16 sm:py-20">
          <SectionHeading
            as="h1"
            title="Pays for itself with one approved change."
            intro="Start free on your next project. Pro and Agency are planned prices; paid plans aren't open yet, so everyone starts on Free. Prices in Indian rupees; GST extra where applicable."
          />
          <RateCard plans={plans} className="mt-12" planHeading="h2" />
        </Container>
      </section>

      <ComparePlans plans={plans} />

      <section className="border-b">
        <Container className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <SectionHeading
            title="Plans and payments."
            className="content-start self-start"
          />
          <Faq items={BILLING_FAQ} />
        </Container>
      </section>

      <FinalCta />
    </>
  );
}
