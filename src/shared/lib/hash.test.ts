import { describe, expect, it } from "vitest";
import { canonicalJson, hashSnapshot } from "./hash";
import { generateToken, hashToken, tokenMatchesHash } from "./token";

describe("canonicalJson / hashSnapshot", () => {
  it("ignores key order", () => {
    const a = { total: 100, items: [{ title: "Home", amount: 100 }] };
    const b = { items: [{ amount: 100, title: "Home" }], total: 100 };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
    expect(hashSnapshot(a)).toBe(hashSnapshot(b));
  });

  it("changes when content changes", () => {
    expect(hashSnapshot({ total: 100 })).not.toBe(hashSnapshot({ total: 101 }));
  });

  it("keeps array order significant and drops undefined keys", () => {
    expect(canonicalJson([2, 1])).not.toBe(canonicalJson([1, 2]));
    expect(canonicalJson({ a: 1, b: undefined })).toBe('{"a":1}');
  });

  it("serialises dates as ISO strings", () => {
    expect(canonicalJson({ at: new Date("2026-11-04T10:12:00.000Z") })).toBe(
      '{"at":"2026-11-04T10:12:00.000Z"}',
    );
  });
});

describe("tokens", () => {
  it("generates unique url-safe tokens", () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1).not.toBe(t2);
    expect(t1).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("verifies a token against its stored hash", () => {
    const token = generateToken();
    const stored = hashToken(token);
    expect(tokenMatchesHash(token, stored)).toBe(true);
    expect(tokenMatchesHash(generateToken(), stored)).toBe(false);
  });
});
