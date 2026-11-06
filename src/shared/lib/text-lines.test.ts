import { describe, expect, it } from "vitest";
import { joinLines, linesField, splitLines } from "./text-lines";

describe("splitLines", () => {
  it("cleans up pasted lists", () => {
    expect(
      splitLines(
        "  Logo in SVG \n\n- Page text\n• Photos\n3. Access to hosting\r\n",
      ),
    ).toEqual(["Logo in SVG", "Page text", "Photos", "Access to hosting"]);
    expect(joinLines(["a", "b"])).toBe("a\nb");
  });

  it("validates count and length", () => {
    const field = linesField({ maxItems: 2, maxLength: 5, label: "term" });
    expect(field.parse("one\ntwo")).toEqual(["one", "two"]);
    expect(field.safeParse("one\ntwo\nthree").success).toBe(false);
    expect(field.safeParse("toolong").error?.issues[0]?.message).toBe(
      "Keep each term under 5 characters.",
    );
  });
});
