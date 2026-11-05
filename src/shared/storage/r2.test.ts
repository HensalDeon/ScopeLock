import { describe, expect, it } from "vitest";
import { keyBelongsTo, newStorageKey } from "./r2";

describe("storage keys", () => {
  it("are random and inside the workspace folder", () => {
    const a = newStorageKey("6728f0c2a1b2c3d4e5f60718", "logo", "webp");
    const b = newStorageKey("6728f0c2a1b2c3d4e5f60718", "logo", "webp");
    expect(a).toMatch(
      /^ws\/6728f0c2a1b2c3d4e5f60718\/logo\/[A-Za-z0-9_-]{24}\.webp$/,
    );
    expect(a).not.toBe(b);
  });

  it("refuse odd workspace ids", () => {
    expect(() => newStorageKey("../other", "cover", "jpg")).toThrow();
  });

  it("checks a key belongs to a workspace", () => {
    expect(keyBelongsTo("ws/abc/logo/x.webp", "abc")).toBe(true);
    expect(keyBelongsTo("ws/abcd/logo/x.webp", "abc")).toBe(false);
    expect(keyBelongsTo("ws/abc/../xyz/logo.webp", "abc")).toBe(false);
  });
});
