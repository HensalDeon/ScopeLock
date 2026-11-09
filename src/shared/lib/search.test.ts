import { describe, expect, it } from "vitest";
import {
  containsPattern,
  listHref,
  parseSearch,
  phoneDigits,
  SEARCH_MAX_LENGTH,
} from "./search";

describe("parseSearch", () => {
  it("trims, collapses spaces and caps the length", () => {
    expect(parseSearch("  Rahul   Mehta ")).toBe("Rahul Mehta");
    expect(parseSearch("x".repeat(100))).toHaveLength(SEARCH_MAX_LENGTH);
    expect(parseSearch(["Asha", "ignored"])).toBe("Asha");
  });
  it("is null when there's nothing to search for", () => {
    expect(parseSearch("   ")).toBeNull();
    expect(parseSearch(undefined)).toBeNull();
  });
});

describe("containsPattern", () => {
  it("matches the text literally, ignoring case", () => {
    const rx = containsPattern("mehta (interiors)");
    expect(rx.test("Rahul · Mehta (Interiors) Pvt")).toBe(true);
    expect(containsPattern(".*").test("anything")).toBe(false);
  });
});

describe("phoneDigits", () => {
  it("pulls digits from something that looks like a phone number", () => {
    expect(phoneDigits("98765 43210")).toBe("9876543210");
    expect(phoneDigits("+91 98765")).toBe("9198765");
    expect(phoneDigits("Rahul")).toBeNull();
    expect(phoneDigits("12")).toBeNull();
  });
});

describe("listHref", () => {
  it("keeps the search and page, drops empties and page 1", () => {
    expect(listHref("/clients", { q: "rahul", page: 2 })).toBe(
      "/clients?q=rahul&page=2",
    );
    expect(listHref("/clients", { q: null, page: 1 })).toBe("/clients");
    expect(listHref("/clients", { view: "archived", q: "a&b" })).toBe(
      "/clients?view=archived&q=a%26b",
    );
  });
});
