import type { Metadata } from "next";
import { PLANS } from "@/modules/billing";
import {
  ClientView,
  Evidence,
  FaqSection,
  FinalCta,
  Hero,
  HowItWorks,
  Payments,
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
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: site.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: site.description,
  url: site.url,
  offers: PLANS.map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    price: (plan.monthlyPrice / 100).toFixed(2),
    priceCurrency: "INR",
  })),
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <SmallRequests />
      <HowItWorks />
      <ClientView />
      <Payments />
      <Evidence />
      <PricingSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
