import type { Metadata } from "next";
import { getPlans } from "@/modules/billing/server";
import {
  Evidence,
  FaqSection,
  FinalCta,
  Hero,
  HowItWorks,
  ManyClients,
  PricingSection,
  SmallRequests,
} from "@/modules/marketing";
import { site } from "@/shared/config/site";

export const metadata: Metadata = {
  title: {
    absolute: `${site.name}: get paid for the extra work clients ask for`,
  },
  description: site.description,
  alternates: { canonical: "/" },
};

/** Structured data so search engines understand what ScopeLock is and costs. */
const jsonLd = (plans: Awaited<ReturnType<typeof getPlans>>) => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: site.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: site.description,
  url: site.url,
  offers: plans.map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    price: (plan.monthlyPrice / 100).toFixed(2),
    priceCurrency: "INR",
  })),
});

export default async function HomePage() {
  const plans = await getPlans();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(plans)) }}
      />
      <Hero />
      <SmallRequests />
      <HowItWorks />
      <Evidence />
      <ManyClients />
      <PricingSection plans={plans} />
      <FaqSection />
      <FinalCta />
    </>
  );
}
