import { describe, expect, it } from "vitest";
import { lineFeature, lineIssue } from "./plan-lines";
import { DEFAULT_PLANS } from "./plans";

const [free, pro, agency] = DEFAULT_PLANS.map((p) => p);
const line = (label: string, soon = false) => ({ label, soon });

describe("lineIssue", () => {
  it("finds nothing wrong with the starting plans", () => {
    for (const plan of [free!, pro!, agency!])
      for (const h of plan.highlights)
        expect(lineIssue({ label: h.label, soon: Boolean(h.soon) }, plan)).toBe(
          null,
        );
  });

  it("catches a limit the line no longer matches", () => {
    expect(
      lineIssue(line("6 active projects"), { ...pro!, activeProjects: 8 }),
    ).toBe("Says 6 active projects; the limit is 8.");
    expect(
      lineIssue(line("Up to 5 team members", true), {
        ...agency!,
        teamMembers: 3,
      }),
    ).toBe("Says 5 team members; the limit is 3.");
  });

  it("catches a feature that's off, unbuilt without soon, or built with soon", () => {
    expect(lineIssue(line("Priority support"), pro!)).toBe(
      "Priority support is switched off for this plan.",
    );
    expect(lineIssue(line("Automatic payment reminders"), pro!)).toBe(
      "Automatic payment reminders isn't built yet: mark it soon.",
    );
    expect(lineIssue(line("Your logo on approval pages", true), pro!)).toBe(
      "Your branding for clients is built: turn off soon.",
    );
  });

  it("leaves everyday lines alone", () => {
    expect(lineFeature("WhatsApp and email reminders")).toBeUndefined();
    expect(lineIssue(line("Unlimited change requests"), free!)).toBe(null);
  });
});
