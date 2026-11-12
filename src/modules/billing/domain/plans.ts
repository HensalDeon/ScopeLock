/**
 * ScopeLock subscription plans.
 *
 * Plans live in the database and are edited from the admin page; these are
 * the defaults the database starts from (and what the site shows when the
 * database isn't reachable, e.g. a build without secrets). Prices are in
 * paise. Three fixed plans: Free, Pro, Agency.
 */
import { z } from "zod";
import { formatINR, paise, type Paise } from "@/shared/lib/money";

export const PLAN_IDS = ["free", "pro", "agency"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/** What a plan unlocks, beyond its limits. */
export const PLAN_FEATURES = [
  "brandedClientPages",
  "automaticReminders",
  "recoveredReports",
  "prioritySupport",
] as const;
export type PlanFeature = (typeof PLAN_FEATURES)[number];

export const FEATURE_LABELS: Record<
  PlanFeature,
  { title: string; detail: string; built: boolean }
> = {
  brandedClientPages: {
    title: "Your branding for clients",
    detail:
      "Your logo on client pages and documents instead of your initials, and no “Sent with ScopeLock”.",
    built: true,
  },
  automaticReminders: {
    title: "Automatic payment reminders",
    detail:
      "Unpaid payments are emailed to the client 3, 7 and 14 days after you ask, without you pressing anything.",
    built: true,
  },
  recoveredReports: {
    title: "Revenue recovered reports",
    detail: "Recovered work by client and month, to download.",
    built: false,
  },
  prioritySupport: {
    title: "Priority support",
    detail: "Questions answered first.",
    built: true,
  },
};

export type PlanHighlight = { label: string; soon?: boolean };

export type Plan = {
  id: PlanId;
  name: string;
  summary: string;
  /** Monthly price. 0 = free (always, for the Free plan). */
  monthlyPrice: Paise;
  /** Projects that aren't archived. */
  activeProjects: number;
  teamMembers: number;
  features: Record<PlanFeature, boolean>;
  /** The lines the pricing page lists under the plan. */
  highlights: PlanHighlight[];
};

export const DEFAULT_PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: paise(0),
    summary: "For trying it on your next project.",
    activeProjects: 2,
    teamMembers: 1,
    features: {
      brandedClientPages: false,
      automaticReminders: false,
      recoveredReports: false,
      prioritySupport: false,
    },
    highlights: [
      { label: "2 active projects" },
      { label: "Unlimited change requests" },
      { label: "Client approval links" },
      { label: "UPI, bank and payment-link tracking" },
      { label: "WhatsApp and email reminders" },
      { label: "Revenue recovered on your overview" },
      { label: "Change order and statement PDFs" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: paise(49_900),
    summary: "For freelancers and small studios with a full client list.",
    activeProjects: 6,
    teamMembers: 1,
    features: {
      brandedClientPages: true,
      automaticReminders: true,
      recoveredReports: false,
      prioritySupport: false,
    },
    highlights: [
      { label: "6 active projects" },
      { label: "Everything in Free" },
      { label: "Your logo on approval pages and PDFs" },
      { label: "No ScopeLock branding for clients" },
      { label: "Automatic payment reminders" },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: paise(199_900),
    summary: "For studios and agencies running many clients.",
    activeProjects: 15,
    teamMembers: 5,
    features: {
      brandedClientPages: true,
      automaticReminders: true,
      recoveredReports: true,
      prioritySupport: true,
    },
    highlights: [
      { label: "15 active projects" },
      { label: "Everything in Pro" },
      { label: "Revenue recovered reports by client and month", soon: true },
      { label: "Up to 5 team members", soon: true },
      { label: "Priority support" },
    ],
  },
];

export function planById(
  plans: readonly Plan[],
  id: string | null | undefined,
): Plan | undefined {
  return plans.find((p) => p.id === id);
}

/** Plans in their fixed order (Free, Pro, Agency), defaults for any missing. */
export function completePlans(stored: readonly Plan[]): Plan[] {
  return PLAN_IDS.map(
    (id) =>
      stored.find((p) => p.id === id) ??
      (DEFAULT_PLANS.find((p) => p.id === id) as Plan),
  );
}

// ── Admin edits ───────────────────────────────────────────────────────────

const MAX_RUPEES = 10_00_000;

/** What the admin form sends (prices in rupees; checked and capped). */
export const planInputSchema = z
  .object({
    id: z.enum(PLAN_IDS),
    name: z.string().trim().min(1, "Give the plan a name.").max(40),
    summary: z
      .string()
      .trim()
      .min(1, "Say who the plan is for, in one line.")
      .max(140),
    monthlyRupees: z.coerce
      .number({ error: "Enter the monthly price in rupees." })
      .int("Use whole rupees.")
      .min(0, "The price can't be negative.")
      .max(MAX_RUPEES, "That price is too high to be right."),
    activeProjects: z.coerce
      .number()
      .int()
      .min(1, "Allow at least 1 active project.")
      .max(1000),
    teamMembers: z.coerce.number().int().min(1).max(100),
    features: z.array(z.enum(PLAN_FEATURES)).max(PLAN_FEATURES.length),
    highlights: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(80),
          soon: z.boolean(),
        }),
      )
      .max(12, "Keep it to 12 lines or fewer."),
  })
  .superRefine((v, ctx) => {
    if (v.id === "free" && v.monthlyRupees !== 0)
      ctx.addIssue({
        code: "custom",
        path: ["monthlyRupees"],
        message: "The Free plan is always ₹0.",
      });
    if (v.id !== "free" && v.monthlyRupees === 0)
      ctx.addIssue({
        code: "custom",
        path: ["monthlyRupees"],
        message: "A paid plan needs a price.",
      });
  });

export type PlanInput = z.output<typeof planInputSchema>;

export function planFromInput(input: PlanInput): Plan {
  return {
    id: input.id,
    name: input.name,
    summary: input.summary,
    monthlyPrice: paise(input.monthlyRupees * 100),
    activeProjects: input.activeProjects,
    teamMembers: input.teamMembers,
    features: Object.fromEntries(
      PLAN_FEATURES.map((f) => [f, input.features.includes(f)]),
    ) as Record<PlanFeature, boolean>,
    highlights: input.highlights.map((h) =>
      h.soon ? { label: h.label, soon: true } : { label: h.label },
    ),
  };
}

/** What changed, in words, for the audit log ("Price ₹499 → ₹599"). */
export function planChanges(before: Plan, after: Plan): string[] {
  const out: string[] = [];
  if (before.name !== after.name)
    out.push(`Name “${before.name}” → “${after.name}”`);
  if (before.summary !== after.summary) out.push("Summary changed");
  if (before.monthlyPrice !== after.monthlyPrice)
    out.push(
      `Price ${formatINR(before.monthlyPrice)} → ${formatINR(after.monthlyPrice)} a month`,
    );
  if (before.activeProjects !== after.activeProjects)
    out.push(
      `Active projects ${before.activeProjects} → ${after.activeProjects}`,
    );
  if (before.teamMembers !== after.teamMembers)
    out.push(`Team members ${before.teamMembers} → ${after.teamMembers}`);
  for (const f of PLAN_FEATURES) {
    if (before.features[f] !== after.features[f])
      out.push(
        `${FEATURE_LABELS[f].title} ${after.features[f] ? "turned on" : "turned off"}`,
      );
  }
  if (JSON.stringify(before.highlights) !== JSON.stringify(after.highlights))
    out.push("Pricing page list changed");
  return out;
}

/** What the admin form starts from: the plan as the form sends it back. */
export type PlanFormValues = {
  id: PlanId;
  name: string;
  summary: string;
  monthlyRupees: string;
  activeProjects: string;
  teamMembers: string;
  features: PlanFeature[];
  highlights: { label: string; soon: boolean }[];
};

export function planFormValues(plan: Plan): PlanFormValues {
  return {
    id: plan.id,
    name: plan.name,
    summary: plan.summary,
    monthlyRupees: String(plan.monthlyPrice / 100),
    activeProjects: String(plan.activeProjects),
    teamMembers: String(plan.teamMembers),
    features: PLAN_FEATURES.filter((f) => plan.features[f]),
    highlights: plan.highlights.map((h) => ({
      label: h.label,
      soon: Boolean(h.soon),
    })),
  };
}
