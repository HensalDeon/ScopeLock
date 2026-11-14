/**
 * Pricing words that depend on the live plan prices (edited in the admin
 * page), so the copy never promises something the price no longer supports.
 */

const YEARS = ["", "a year", "two years", "three years", "four years"];

/** How long a one-off amount would pay for a monthly price, in words. */
export function coverage(amountPaise: number, monthlyPaise: number): string {
  if (monthlyPaise <= 0) return "";
  const months = Math.floor(amountPaise / monthlyPaise);
  if (months < 1) return "";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  const exact = months % 12 === 0;
  const words = YEARS[years] ?? `${years} years`;
  return exact ? words : `over ${words}`;
}

type PlanLine = {
  id: string;
  name: string;
  monthlyPrice: number;
  activeProjects: number;
  summary: string;
};

const rupees = (paise: number) =>
  `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

/** The /pricing meta description, from the live plans. */
export function pricingDescription(plans: readonly PlanLine[]): string {
  return plans
    .map((p) =>
      p.monthlyPrice === 0
        ? `ScopeLock is free for ${p.activeProjects} active project${p.activeProjects === 1 ? "" : "s"}.`
        : `${p.name} is ${rupees(p.monthlyPrice)} a month, ${p.summary.charAt(0).toLowerCase()}${p.summary.slice(1)}`,
    )
    .join(" ");
}
