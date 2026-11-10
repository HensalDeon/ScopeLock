/**
 * ScopeLock subscription plans.
 *
 * Single source of truth for the pricing UI today; Phase 8 moves these to
 * the database / Razorpay plans and enforces the limits.
 * Prices are in paise.
 */
import { paise, type Paise } from "@/shared/lib/money";

export type PlanId = "free" | "pro" | "agency";

export type Plan = {
  id: PlanId;
  name: string;
  /** Monthly price. 0 = free. */
  monthlyPrice: Paise;
  summary: string;
  activeProjects: number;
  teamMembers: number;
  features: { label: string; soon?: boolean }[];
};

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: paise(0),
    summary: "For trying it on your next project.",
    activeProjects: 2,
    teamMembers: 1,
    features: [
      { label: "2 active projects" },
      { label: "Unlimited change requests" },
      { label: "Client approval links" },
      { label: "UPI, bank and payment-link tracking" },
      { label: "WhatsApp and email reminders" },
      { label: "Revenue recovered on your overview" },
      { label: "Change order PDFs" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: paise(49_900),
    summary: "For freelancers and small studios with a full client list.",
    activeProjects: 6,
    teamMembers: 1,
    features: [
      { label: "6 active projects" },
      { label: "Everything in Free" },
      { label: "Your logo on approval pages and PDFs" },
      { label: "No ScopeLock branding for clients" },
      { label: "Automatic payment reminders", soon: true },
      { label: "Full project statements" },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: paise(199_900),
    summary: "For studios and agencies running many clients.",
    activeProjects: 15,
    teamMembers: 5,
    features: [
      { label: "15 active projects" },
      { label: "Everything in Pro" },
      { label: "Revenue recovered reports by client and month", soon: true },
      { label: "Up to 5 team members", soon: true },
      { label: "Priority support" },
    ],
  },
];

export function planById(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
