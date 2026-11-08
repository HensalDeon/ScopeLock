import { describe, expect, it } from "vitest";
import { decisionInputSchema, verdictLabel } from "./approval";

const base = {
  decision: "approved",
  name: "  Rahul Mehta ",
  email: " Rahul@Mehta.in ",
  comment: "",
};

describe("decisionInputSchema", () => {
  it("cleans an approval", () => {
    expect(decisionInputSchema.parse(base)).toEqual({
      decision: "approved",
      name: "Rahul Mehta",
      email: "rahul@mehta.in",
      comment: null,
    });
  });

  it("needs a comment when asking for changes", () => {
    const result = decisionInputSchema.safeParse({
      ...base,
      decision: "rejected",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["comment"]);
    expect(
      decisionInputSchema.parse({
        ...base,
        decision: "rejected",
        comment: "Add a blog page",
      }).comment,
    ).toBe("Add a blog page");
  });

  it("flags the missing note even when the name is also wrong", () => {
    const result = decisionInputSchema.safeParse({
      ...base,
      decision: "rejected",
      name: "",
    });
    expect(result.error?.issues.map((i) => i.path[0]).sort()).toEqual([
      "comment",
      "name",
    ]);
  });

  it("rejects unknown decisions, short names and bad emails", () => {
    for (const bad of [
      { decision: "maybe" },
      { name: "R" },
      { email: "rahul" },
      { comment: "x".repeat(2001) },
    ]) {
      expect(decisionInputSchema.safeParse({ ...base, ...bad }).success).toBe(
        false,
      );
    }
  });
});

describe("verdictLabel", () => {
  it("words a 'no' by what was answered", () => {
    const subject = (type: "baseline" | "change_request") => ({
      type,
      id: "x",
    });
    expect(
      verdictLabel({
        decision: "approved",
        subject: subject("change_request"),
      }),
    ).toBe("Approved");
    expect(
      verdictLabel({ decision: "rejected", subject: subject("baseline") }),
    ).toBe("Changes requested");
    expect(
      verdictLabel({
        decision: "rejected",
        subject: subject("change_request"),
      }),
    ).toBe("Declined");
  });
});
