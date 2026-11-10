import { describe, expect, it } from "vitest";
import { documentTitle } from "./document-title";

describe("documentTitle", () => {
  it("joins the parts and makes them safe for a file name", () => {
    expect(documentTitle("Tax invoice AD/26-27/010", "Asha Menon")).toBe(
      "Tax invoice AD-26-27-010 · Asha Menon",
    );
    expect(documentTitle("Proposal P-007", null, " Website redesign ")).toBe(
      "Proposal P-007 · Website redesign",
    );
  });
});
