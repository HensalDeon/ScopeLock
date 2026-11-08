import { describe, expect, it } from "vitest";
import { cssString } from "./css-string";

describe("cssString", () => {
  it("quotes plain text", () => {
    expect(cssString("Deon Digital · Proposal P-1F107C")).toBe(
      '"Deon Digital · Proposal P-1F107C"',
    );
  });

  it("can't break out of the string or the style element", () => {
    const out = cssString('A "B" \\ C\n</style><script>');
    expect(out).toBe('"A \\"B\\" \\\\ C \\3c /style\\3e \\3c script\\3e "');
    expect(out).not.toContain("</style>");
  });
});
