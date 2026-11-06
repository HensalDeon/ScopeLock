import { describe, expect, it } from "vitest";
import {
  clampPage,
  pageWindow,
  paginate,
  parsePage,
  toPage,
} from "./pagination";

describe("pagination", () => {
  it("reads ?page safely", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage(["2", "5"])).toBe(2);
    for (const bad of [undefined, "", "0", "-1", "abc", "1.5", "9999999", 4]) {
      expect(parsePage(bad)).toBe(1);
    }
  });

  it("clamps to the last page and computes windows", () => {
    expect(clampPage(99, 45)).toBe(3);
    expect(clampPage(2, 0)).toBe(1);
    expect(pageWindow(3)).toEqual({ skip: 40, limit: 20 });
    expect(toPage([], 41, 1)).toMatchObject({ pageCount: 3, total: 41 });
  });

  it("loads the clamped page", async () => {
    const all = Array.from({ length: 45 }, (_, i) => i);
    const page = await paginate(
      9,
      async () => all.length,
      async ({ skip, limit }) => all.slice(skip, skip + limit),
    );
    expect(page).toMatchObject({ page: 3, pageCount: 3, total: 45 });
    expect(page.items).toEqual([40, 41, 42, 43, 44]);
    const empty = await paginate(
      2,
      async () => 0,
      async () => {
        throw new Error("not called");
      },
    );
    expect(empty).toMatchObject({ page: 1, items: [], pageCount: 1 });
  });
});
