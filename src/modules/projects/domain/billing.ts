import { z } from "zod";
import { allocate, paise, type Paise } from "@/shared/lib/money";

export const BILLING_MODELS = ["upfront", "milestones"] as const;
export type BillingModel = (typeof BILLING_MODELS)[number];

/**
 * A payment stage. `baseAmount` is this milestone's share of the agreed
 * scope; approved change requests add to it later (Phase 4/5).
 */
export type Milestone = {
  id: string;
  name: string;
  /** Whole percent of the baseline, 1–100. */
  percent: number;
  baseAmount: Paise;
  order: number;
};

export const MILESTONE_LIMITS = { min: 2, max: 10, nameMax: 60 } as const;

export type MilestonePreset = {
  id: string;
  label: string;
  milestones: { name: string; percent: number }[];
};

/** Common Indian freelance splits. Names are editable after picking. */
export const MILESTONE_PRESETS: readonly MilestonePreset[] = [
  {
    id: "30-30-40",
    label: "30 / 30 / 40",
    milestones: [
      { name: "Advance", percent: 30 },
      { name: "Design approved", percent: 30 },
      { name: "Before launch", percent: 40 },
    ],
  },
  {
    id: "50-50",
    label: "50 / 50",
    milestones: [
      { name: "Advance", percent: 50 },
      { name: "On delivery", percent: 50 },
    ],
  },
  {
    id: "40-60",
    label: "40 / 60",
    milestones: [
      { name: "Advance", percent: 40 },
      { name: "On delivery", percent: 60 },
    ],
  },
];

export const UPFRONT_MILESTONE = {
  name: "Full payment",
  percent: 100,
} as const;

export const milestoneInputSchema = z.object({
  id: z.uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Name this payment.")
    .max(
      MILESTONE_LIMITS.nameMax,
      `Keep it under ${MILESTONE_LIMITS.nameMax} characters.`,
    ),
  percent: z.coerce
    .number({ error: "Enter a percentage." })
    .int("Use a whole number.")
    .min(1, "At least 1%.")
    .max(100, "At most 100%."),
});

export type MilestoneInput = z.output<typeof milestoneInputSchema>;

export function percentTotal(
  milestones: readonly { percent: number }[],
): number {
  return milestones.reduce((total, m) => total + m.percent, 0);
}

/**
 * Splits the agreed total across milestones by percentage. Uses allocate(),
 * so the amounts always add up to the total exactly (no lost paise).
 */
export function splitByMilestones(
  total: Paise,
  milestones: readonly { percent: number }[],
): Paise[] {
  return allocate(
    total,
    milestones.map((m) => m.percent),
  );
}

/** Builds stored milestones: ids, order and each one's share of the total. */
export function buildMilestones(
  total: Paise,
  inputs: readonly MilestoneInput[],
  newId: () => string,
): Milestone[] {
  const amounts = splitByMilestones(total, inputs);
  return inputs.map((input, index) => ({
    id: input.id ?? newId(),
    name: input.name,
    percent: input.percent,
    baseAmount: amounts[index] ?? paise(0),
    order: index,
  }));
}
