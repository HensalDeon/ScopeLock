import { describe, expect, it } from "vitest";
import { buildProjectPlan, projectInputSchema } from "./project";
import { hasProposalSections, proposalInputSchema } from "./proposal";

let n = 0;
const newId = () => `id-${++n}`;

const base = {
  clientId: "6728f0c2a1b2c3d4e5f60718",
  currency: "INR",
  name: "Website redesign",
  description: "",
  items: JSON.stringify([
    {
      title: "Home page",
      amount: "20000",
      includes:
        "Hero with call to action\n- Services highlight\n\n• Testimonials",
    },
  ]),
  billingModel: "upfront",
  milestones: "[]",
};

const fullProposal = {
  title: "Website design & development proposal",
  subtitle: "A custom 5-page website for Mehta Interiors",
  overview: "Thank you for the opportunity.\n\nHere's what I'll build.",
  callout: "Design inspired by your reference site, built from scratch.",
  highlights: [
    { value: "5", label: "Custom pages" },
    { value: "~4 wks", label: "Design to launch" },
  ],
  timeline: [
    {
      phase: "Design",
      duration: "Days 1–7",
      description: "Figma designs",
      isMilestone: false,
    },
    { phase: "Launch", duration: "Day 25", description: "", isMilestone: true },
  ],
  clientProvides: "Logo\nPage text",
  exclusions: "Hosting fees",
  terms: "Valid for 14 days\nGST extra",
  addons: [
    { title: "Extra page", description: "", amount: "6,000", unit: "/ page" },
  ],
  validUntil: "2026-11-19",
};

describe("proposal content", () => {
  it("parses every section and cleans up lists", () => {
    const input = projectInputSchema.parse({
      ...base,
      proposal: JSON.stringify(fullProposal),
    });
    const plan = buildProjectPlan(input, newId);
    expect(plan.items[0]?.includes).toEqual([
      "Hero with call to action",
      "Services highlight",
      "Testimonials",
    ]);
    expect(plan.proposal).toMatchObject({
      title: "Website design & development proposal",
      clientProvides: ["Logo", "Page text"],
      exclusions: ["Hosting fees"],
      terms: ["Valid for 14 days", "GST extra"],
      validUntil: "2026-11-19",
    });
    expect(plan.proposal.addons[0]).toMatchObject({
      title: "Extra page",
      amount: 600_000,
      unit: "/ page",
    });
    expect(plan.proposal.timeline.map((s) => s.id)).toEqual([
      expect.any(String),
      expect.any(String),
    ]);
    expect(plan.proposal.timeline[1]?.description).toBeNull();
    expect(hasProposalSections(plan.proposal)).toBe(true);
  });

  it("works without any proposal (older forms)", () => {
    const plan = buildProjectPlan(projectInputSchema.parse(base), newId);
    expect(plan.proposal.highlights).toEqual([]);
    expect(plan.proposal.title).toBeNull();
    expect(hasProposalSections(plan.proposal)).toBe(false);
  });

  it("points each bad row at its own field", () => {
    const result = proposalInputSchema.safeParse({
      ...fullProposal,
      highlights: [{ value: "", label: "Pages" }],
      timeline: [{ phase: "", isMilestone: false }],
      addons: [{ title: "Logo", amount: "abc" }],
      validUntil: "next week",
    });
    expect(result.error!.issues.map((i) => i.path.join("."))).toEqual([
      "highlights.0.value",
      "timeline.0.phase",
      "addons.0.amount",
      "validUntil",
    ]);
  });

  it("caps sizes so a proposal can't grow without limit", () => {
    const tooMany = Array.from({ length: 7 }, () => ({
      value: "1",
      label: "x",
    }));
    expect(
      proposalInputSchema.safeParse({ ...fullProposal, highlights: tooMany })
        .success,
    ).toBe(false);
  });
});
