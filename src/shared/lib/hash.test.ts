import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { canonicalJson, hashSnapshot } from "./hash";

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

  it("keeps array order significant, nulls, and drops undefined keys", () => {
    expect(canonicalJson([2, 1])).not.toBe(canonicalJson([1, 2]));
    expect(canonicalJson({ a: 1, b: undefined, c: null })).toBe(
      '{"a":1,"c":null}',
    );
    expect(canonicalJson({ list: [[1, 2], [3]] })).toBe('{"list":[[1,2],[3]]}');
  });

  it("serialises dates and ObjectIds as strings", () => {
    const id = new ObjectId("6728f0c2a1b2c3d4e5f60718");
    expect(
      canonicalJson({ at: new Date("2026-11-04T10:12:00.000Z"), id }),
    ).toBe('{"at":"2026-11-04T10:12:00.000Z","id":"6728f0c2a1b2c3d4e5f60718"}');
  });

  it("normalises unicode so the same text hashes the same", () => {
    const composed = "Café"; // é as one code point
    const decomposed = "Café"; // e + combining accent
    expect(hashSnapshot({ name: composed })).toBe(
      hashSnapshot({ name: decomposed }),
    );
  });

  it.each([
    ["a float", { amount: 12.5 }],
    ["NaN", { amount: Number.NaN }],
    ["a Map", { m: new Map([["a", 1]]) }],
    ["a Set", { s: new Set([1]) }],
    ["a class instance", { x: new (class Thing {})() }],
    ["a bigint", { n: BigInt(1) }],
    ["an invalid date", { d: new Date("nope") }],
  ])("rejects %s instead of hashing it wrongly", (_label, value) => {
    expect(() => canonicalJson(value)).toThrow(TypeError);
  });
});
