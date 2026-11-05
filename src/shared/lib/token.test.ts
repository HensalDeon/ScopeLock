import { describe, expect, it } from "vitest";
import { generateToken, hashToken, tokenMatchesHash } from "./token";

describe("tokens", () => {
  it("generates unique url-safe 256-bit tokens", () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1).not.toBe(t2);
    expect(t1).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("verifies a token against its stored hash", () => {
    const token = generateToken();
    const stored = hashToken(token);
    expect(stored).not.toContain(token);
    expect(tokenMatchesHash(token, stored)).toBe(true);
    expect(tokenMatchesHash(generateToken(), stored)).toBe(false);
  });

  it("rejects malformed or wrong-length stored hashes without throwing", () => {
    const token = generateToken();
    expect(tokenMatchesHash(token, "")).toBe(false);
    expect(tokenMatchesHash(token, "abc123")).toBe(false);
    expect(tokenMatchesHash(token, "zz".repeat(32))).toBe(false);
  });
});
