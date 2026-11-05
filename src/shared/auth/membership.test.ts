import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { idCandidates } from "./membership";

describe("idCandidates", () => {
  it("matches both string and ObjectId forms of a hex id", () => {
    const [asString, asObjectId] = idCandidates("6728f0c2a1b2c3d4e5f60718");
    expect(asString).toBe("6728f0c2a1b2c3d4e5f60718");
    expect(asObjectId).toBeInstanceOf(ObjectId);
  });

  it("keeps non-hex ids as plain strings", () => {
    expect(idCandidates("user_abc")).toEqual(["user_abc"]);
    // 12-character strings are valid ObjectIds to the driver; not to us.
    expect(idCandidates("aaaaaaaaaaaa")).toEqual(["aaaaaaaaaaaa"]);
  });
});
