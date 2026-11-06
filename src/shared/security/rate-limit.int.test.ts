import { describe, expect, it } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("allows up to the limit in a window, then refuses", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(
        (await rateLimit("test:ip-1", { limit: 3, windowSeconds: 60 })).allowed,
      );
    }
    expect(results).toEqual([true, true, true, false]);
  });

  it("counts each key separately", async () => {
    await rateLimit("test:ip-2", { limit: 1, windowSeconds: 60 });
    expect(
      (await rateLimit("test:ip-3", { limit: 1, windowSeconds: 60 })).allowed,
    ).toBe(true);
    expect(
      (await rateLimit("test:ip-2", { limit: 1, windowSeconds: 60 })).allowed,
    ).toBe(false);
  });
});
