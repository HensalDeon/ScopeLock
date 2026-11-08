import { minor } from "@/shared/lib/money";
import type { ProposalDocumentData } from "./document-data";
import { STARTER_PROPOSAL_DEFAULTS, type ProposalDefaults } from "./defaults";

/**
 * A complete proposal for the style preview in Settings: every section filled
 * in (Rahul's 5-page website, ₹80,000, 30/30/40), so each one can be seen in
 * the chosen style. Uses the workspace's own default text.
 */
export function sampleProposal(
  business: ProposalDocumentData["business"],
  voice: "I" | "we",
  defaults: ProposalDefaults = STARTER_PROPOSAL_DEFAULTS,
): ProposalDocumentData {
  const now = new Date();
  return {
    voice,
    business,
    client: {
      name: "Rahul Mehta",
      company: "Mehta Interiors",
      email: "rahul@mehtainteriors.in",
      phone: "+919876543210",
    },
    reference: "P-SAMPLE",
    currency: "INR",
    title: "Website design & development proposal",
    subtitle:
      "A custom 5-page website for Mehta Interiors: design, build and launch.",
    issuedOn: now,
    validUntil: new Date(now.getTime() + 14 * 86_400_000),
    overview:
      "Thank you for the chance to work on your new website. You want a calm, premium site that shows your interiors work at first glance and turns visitors into enquiries.\n\nYou'll see and approve the full design before development starts, so there are no surprises.",
    callout:
      "Inspired by the references you shared, designed from scratch for your brand.",
    highlights: [
      { value: "5", label: "Custom pages" },
      { value: "100%", label: "Mobile ready" },
      { value: "~4 wks", label: "Design to launch" },
      { value: "30 days", label: "Free support" },
    ],
    items: [
      {
        id: "s1",
        title: "Home page",
        description: null,
        includes: [
          "Hero with call to action",
          "Featured projects",
          "Client testimonials",
        ],
        amount: minor(2_000_000),
      },
      {
        id: "s2",
        title: "About page",
        description: null,
        includes: ["Your story and team", "Process and values"],
        amount: minor(1_200_000),
      },
      {
        id: "s3",
        title: "Services page",
        description: null,
        includes: [
          "Residential and commercial services",
          "Enquiry call to action",
        ],
        amount: minor(1_600_000),
      },
      {
        id: "s4",
        title: "Portfolio page",
        description: null,
        includes: ["Filterable project gallery", "Before and after views"],
        amount: minor(2_000_000),
      },
      {
        id: "s5",
        title: "Contact page",
        description: null,
        includes: [
          "Enquiry form with spam protection",
          "Map, WhatsApp and call buttons",
        ],
        amount: minor(1_200_000),
      },
    ],
    total: minor(8_000_000),
    billingModel: "milestones",
    milestones: [
      {
        id: "m1",
        name: "Advance",
        percent: 30,
        amount: minor(2_400_000),
        dueWhen: "Before work starts",
      },
      {
        id: "m2",
        name: "Design approved",
        percent: 30,
        amount: minor(2_400_000),
        dueWhen: "After Design approval (Days 3–10)",
      },
      {
        id: "m3",
        name: "Before launch",
        percent: 40,
        amount: minor(3_200_000),
        dueWhen: "After Build and launch (Days 11–25)",
      },
    ],
    timeline: [
      {
        id: "t1",
        phase: "Discovery",
        duration: "Days 1–2",
        description: "Kick-off call, sitemap and content checklist.",
        isMilestone: false,
      },
      {
        id: "t2",
        phase: "Design approval",
        duration: "Days 3–10",
        description: "Desktop and mobile designs, two rounds of changes.",
        isMilestone: true,
        payment: { name: "Design approved", amount: minor(2_400_000) },
      },
      {
        id: "t3",
        phase: "Build and launch",
        duration: "Days 11–25",
        description: "Development, testing and go-live.",
        isMilestone: true,
        payment: { name: "Before launch", amount: minor(3_200_000) },
      },
    ],
    addons: [
      {
        id: "a1",
        title: "Extra page",
        description: "Same design system",
        amount: minor(600_000),
        unit: "/ page",
      },
      {
        id: "a2",
        title: "Hindi version",
        description: "Bilingual site",
        amount: minor(1_500_000),
        unit: null,
      },
    ],
    // The workspace's own default text, so saving defaults shows here.
    clientProvides: defaults.clientProvides,
    exclusions: defaults.exclusions,
    terms: defaults.terms,
  };
}
