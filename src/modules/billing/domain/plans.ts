/**
 * ScopeLock subscription plans.
 *
 * Single source of truth for the pricing UI today; Phase 8 moves these to
 * the database / Razorpay plans and enforces the limits.
 * Prices are in paise.
 */
export type PlanId = "free" | "pro" | "agency";

export type Plan = {
  id: PlanId;
  name: string;
  /** Monthly price in paise. 0 = free. */
  monthlyPrice: number;
  summary: string;
  activeProjects: number;
  teamMembers: number;
  features: { label: string; soon?: boolean }[];
  cta: string;
  highlighted?: boolean;
};

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    summary: "For trying it on your next project.",
    activeProjects: 2,
    teamMembers: 1,
    features: [
      { label: "2 active projects" },
      { label: "Unlimited change requests" },
      { label: "Client approval links" },
      { label: "UPI, bank and payment-link tracking" },
      { label: "Change order PDFs" },
    ],
    cta: "Start free",
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 49_900,
    summary: "For freelancers with a full client list.",
    activeProjects: 6,
    teamMembers: 1,
    features: [
      { label: "6 active projects" },
      { label: "Everything in Free" },
      { label: "Your logo on approval pages and PDFs" },
      { label: "No ScopeLock branding for clients" },
      { label: "Payment reminders" },
      { label: "Full project statements" },
    ],
    cta: "Start with Pro",
    highlighted: true,
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: 199_900,
    summary: "For studios and agencies running many clients.",
    activeProjects: 15,
    teamMembers: 5,
    features: [
      { label: "15 active projects" },
      { label: "Everything in Pro" },
      { label: "Revenue recovered reports" },
      { label: "Up to 5 team members", soon: true },
      { label: "Priority support" },
    ],
    cta: "Start with Agency",
  },
] as const;

export function planById(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
