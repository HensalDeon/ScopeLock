import { describe, expect, it } from "vitest";
import { formatINR } from "@/shared/lib/money";
import { FREE_ASKS, neverBilled, STORY, storyTotal } from "./story";

describe("landing page story", () => {
  it("adds up: ₹80,000 agreed + CR-001 ₹15,000 = ₹95,000", () => {
    expect(storyTotal()).toBe(95_000);
  });

  it("splits the agreed price 30/30/40 exactly", () => {
    const ms = STORY.milestones;
    expect(ms.reduce((t, m) => t + m.percent, 0)).toBe(100);
    expect(ms.reduce((t, m) => t + m.amount, 0)).toBe(STORY.agreed);
    for (const m of ms) expect(m.amount).toBe((STORY.agreed * m.percent) / 100);
  });

  it("puts the whole change on the payment it names", () => {
    const extras = STORY.milestones.filter((m) => m.extra > 0);
    expect(extras).toHaveLength(1);
    expect(extras[0]?.name).toBe(STORY.change.billedWith);
    expect(extras[0]?.extra).toBe(STORY.change.amount);
  });

  it("totals the ten free asks to ₹58,500", () => {
    expect(FREE_ASKS).toHaveLength(10); // "ten small ones"
    expect(formatINR(neverBilled())).toBe("₹58,500");
  });

  it("says what CR-001 covers in the same words everywhere", () => {
    expect(STORY.change.detail).toContain(
      "categories, search and 3 starter posts",
    );
    expect(STORY.change.blog).toBe("Categories, search and 3 starter posts.");
  });
});
