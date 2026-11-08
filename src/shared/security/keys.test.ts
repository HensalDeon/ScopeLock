import { beforeAll, describe, expect, it, vi } from "vitest";
import type * as Keys from "./keys";

let keys: typeof Keys;

beforeAll(async () => {
  vi.stubEnv("MONGODB_URI", "mongodb://127.0.0.1:27017");
  vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-test-secret-test-secret-00");
  keys = await import("./keys");
});

describe("encryptText / decryptText", () => {
  it("round-trips and never repeats a ciphertext", () => {
    const a = keys.encryptText("portal-link-v1", "token-123");
    const b = keys.encryptText("portal-link-v1", "token-123");
    expect(a).not.toBe(b);
    expect(a).not.toContain("token-123");
    expect(keys.decryptText("portal-link-v1", a)).toBe("token-123");
  });

  it("rejects tampering and the wrong purpose", () => {
    const sealed = keys.encryptText("portal-link-v1", "token-123");
    const parts = sealed.split(".");
    const flipped = [
      ...parts.slice(0, 3),
      (parts[3] ?? "").replace(/^./, (c) => (c === "A" ? "B" : "A")),
    ].join(".");
    expect(keys.decryptText("portal-link-v1", flipped)).toBeNull();
    expect(keys.decryptText("evidence-v1", sealed)).toBeNull();
    expect(keys.decryptText("portal-link-v1", "garbage")).toBeNull();
  });
});

describe("sign / verifySignature", () => {
  it("verifies its own signatures and nothing else", () => {
    const sig = keys.sign("evidence-v1", '{"decision":"approved"}');
    expect(
      keys.verifySignature("evidence-v1", '{"decision":"approved"}', sig),
    ).toBe(true);
    expect(
      keys.verifySignature("evidence-v1", '{"decision":"rejected"}', sig),
    ).toBe(false);
    expect(
      keys.verifySignature("portal-link-v1", '{"decision":"approved"}', sig),
    ).toBe(false);
    expect(keys.verifySignature("evidence-v1", "x", "not-hex")).toBe(false);
  });
});
