import { describe, expect, it } from "vitest";
import { minor } from "@/shared/lib/money";
import { archiveBlocker, projectLimitReached } from "./archive";
import { emptyTotals } from "./project";

const totals = (patch = {}) => ({ ...emptyTotals(minor(8_000_000)), ...patch });

describe("archiveBlocker", () => {
  it("lets a finished project go", () => {
    expect(
      archiveBlocker(
        { status: "active", totals: totals({ paid: minor(8_000_000) }) },
        "Rahul",
      ),
    ).toBe(null);
    expect(archiveBlocker({ status: "draft", totals: totals() }, "Rahul")).toBe(
      null,
    );
  });

  it("holds while the client has something to answer or pay, and says where", () => {
    expect(
      archiveBlocker(
        { status: "awaiting_approval", totals: totals() },
        "Rahul",
      ),
    ).toMatchObject({
      section: null,
      reason: expect.stringMatching(/proposal is waiting for Rahul's answer/),
    });
    expect(
      archiveBlocker(
        {
          status: "active",
          totals: totals({ pendingChanges: minor(1_500_000) }),
        },
        "Rahul",
      ),
    ).toMatchObject({
      section: "changes",
      reason: expect.stringMatching(/Take it back to edit/),
    });
    expect(
      archiveBlocker(
        { status: "active", totals: totals({ due: minor(2_400_000) }) },
        "Rahul",
      ),
    ).toMatchObject({
      section: "payments",
      reason: expect.stringMatching(/Confirm received/),
    });
  });
});

describe("projectLimitReached", () => {
  it("allows up to the limit, then says what to do", () => {
    expect(projectLimitReached({ active: 1, limit: 2, planName: "Free" })).toBe(
      null,
    );
    expect(projectLimitReached({ active: 2, limit: 2, planName: "Free" })).toBe(
      "You have 2 active projects, and Free allows 2. Archive a finished project to start a new one.",
    );
    expect(
      projectLimitReached({
        active: 6,
        limit: 6,
        planName: "Pro",
        to: "restore this one",
      }),
    ).toMatch(/to restore this one\.$/);
  });
});
