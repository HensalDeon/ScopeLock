import { describe, expect, it } from "vitest";
import { parseObjectId } from "./ids";

describe("parseObjectId", () => {
  it("accepts a 24-character hex id", () => {
    expect(parseObjectId("6728f0c2a1b2c3d4e5f60718")?.toHexString()).toBe(
      "6728f0c2a1b2c3d4e5f60718",
    );
  });

  it.each([
    undefined,
    null,
    "",
    "not-an-id",
    "6728f0c2a1b2c3d4e5f6071", // 23 chars
    "6728f0c2a1b2c3d4e5f60718x",
    "aaaaaaaaaaaa", // 12 chars: ObjectId.isValid accepts this, we don't
    { $ne: null },
    123,
  ])("rejects %j", (raw) => {
    expect(parseObjectId(raw)).toBeNull();
  });
});
