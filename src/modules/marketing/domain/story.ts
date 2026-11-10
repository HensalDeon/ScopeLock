import { formatINR, rupeesToPaise, sum, type Minor } from "@/shared/lib/money";

/**
 * The one story the landing page tells, start to finish (docs/PRODUCT.md §4):
 * Asha's ₹80,000 website for Rahul Mehta, CR-001 at ₹15,000, project total
 * ₹95,000. Illustrative, never presented as a customer. Every section reads
 * its figures from here so the page can't disagree with itself.
 */

export const rupees = (n: number) => formatINR(rupeesToPaise(n));

const BLOG = "Categories, search and 3 starter posts.";

export const STORY = {
  freelancer: "Asha Menon",
  studio: "Asha Menon Studio",
  client: "Rahul Mehta",
  clientFirst: "Rahul",
  clientEmail: "rahul@mehta-interiors.example",
  company: "Mehta Interiors",
  project: "Website, 5 pages",
  pages: ["Home", "About", "Services", "Portfolio", "Contact"],
  /** The agreed price, in rupees. */
  agreed: 80_000,
  agreedOn: "7 Oct",
  change: {
    label: "CR-001",
    title: "Blog + WhatsApp chat button",
    /** What the blog line covers, word for word on every document. */
    blog: BLOG,
    detail: `A blog with ${BLOG.charAt(0).toLowerCase()}${BLOG.slice(1, -1)}, and a WhatsApp chat button on every page.`,
    amount: 15_000,
    askedOn: "28 Oct",
    sentAt: "3:19 pm",
    approvedAt: "3:42 pm",
    billedWith: "Before launch",
  },
  asks: [
    {
      at: "3:12 pm",
      text: "Hey, can you also add a blog section? Should be quick.",
    },
    { at: "3:14 pm", text: "And a WhatsApp chat button on every page?" },
  ],
  milestones: [
    { name: "Advance", percent: 30, amount: 24_000, extra: 0, paidOn: "8 Oct" },
    {
      name: "Design approved",
      percent: 30,
      amount: 24_000,
      extra: 0,
      paidOn: "21 Oct",
    },
    {
      name: "Before launch",
      percent: 40,
      amount: 32_000,
      extra: 15_000,
      paidOn: "3 Nov",
    },
  ],
  utr: "431209876543",
  disputeOn: "9 Nov",
} as const;

/** What the project comes to once the change is approved, in rupees. */
export const storyTotal = () => STORY.agreed + STORY.change.amount;

/**
 * The last project, before ScopeLock: small asks done for free. Each is
 * priced at what the proposal's own add-ons would have charged.
 */
export const FREE_ASKS = [
  {
    on: "14 Jul",
    ask: "Can we add one more page?",
    note: "Founder story",
    amount: 6_000,
  },
  {
    on: "18 Jul",
    ask: "Make the logo animate on load",
    note: "Hero section",
    amount: 2_500,
  },
  {
    on: "26 Jul",
    ask: "Add Razorpay, should be easy",
    note: "Checkout",
    amount: 12_000,
  },
  {
    on: "2 Aug",
    ask: "Can it also be in Hindi?",
    note: "All pages",
    amount: 15_000,
  },
  {
    on: "9 Aug",
    ask: "Small change: new colour scheme",
    note: "Site-wide",
    amount: 5_000,
  },
  {
    on: "16 Aug",
    ask: "Export the enquiries to Excel",
    note: "Admin",
    amount: 4_000,
  },
  {
    on: "23 Aug",
    ask: "A popup for the Diwali offer?",
    note: "Home page",
    amount: 3_500,
  },
  {
    on: "30 Aug",
    ask: "Swap all the project photos",
    note: "Portfolio",
    amount: 2_000,
  },
  {
    on: "6 Sep",
    ask: "Show our Instagram posts too",
    note: "Home page",
    amount: 4_500,
  },
  {
    on: "16 Sep",
    ask: "Can there be a dark mode?",
    note: "Site-wide",
    amount: 4_000,
  },
] as const;

/** The free asks' total, in paise. */
export function neverBilled(): Minor {
  return sum(FREE_ASKS.map((a) => rupeesToPaise(a.amount)));
}
