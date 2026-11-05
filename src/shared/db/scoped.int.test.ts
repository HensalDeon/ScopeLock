import { describe, expect, it } from "vitest";
import { collection } from "./collections";
import { type WorkspaceOwned, scopedCollection } from "./scoped";
import { withTransaction } from "./transaction";

type Note = WorkspaceOwned & { title: string; status?: string };

// Any registered collection name works for these tests.
const NAME = "workspaceProfiles";
const notes = (workspaceId: string) =>
  scopedCollection<Note>(NAME, workspaceId);

describe("scopedCollection", () => {
  it("stamps workspaceId and timestamps on insert", async () => {
    const { insertedId } = await notes("ws_a").insertOne({ title: "Brief" });
    const stored = await collection<Note>(NAME).findOne({ _id: insertedId });
    expect(stored).toMatchObject({ workspaceId: "ws_a", title: "Brief" });
    expect(stored?.createdAt).toBeInstanceOf(Date);
    expect(stored?.updatedAt).toEqual(stored?.createdAt);
  });

  it("never returns another workspace's documents", async () => {
    await notes("ws_b").insertOne({ title: "Secret of B" });
    const fromA = await notes("ws_a").find({ title: "Secret of B" }).toArray();
    expect(fromA).toEqual([]);
    expect(await notes("ws_a").countDocuments({ title: "Secret of B" })).toBe(
      0,
    );
  });

  it("ignores a workspaceId smuggled into the filter", async () => {
    const smuggled = await notes("ws_a").findOne({
      workspaceId: "ws_b",
      title: "Secret of B",
    } as never);
    expect(smuggled).toBeNull();
  });

  it("can't update or delete across workspaces", async () => {
    const update = await notes("ws_a").updateOne(
      { title: "Secret of B" },
      { $set: { title: "Hijacked" } },
    );
    expect(update.matchedCount).toBe(0);
    const removed = await notes("ws_a").deleteOne({ title: "Secret of B" });
    expect(removed.deletedCount).toBe(0);
    expect(await notes("ws_b").countDocuments({ title: "Secret of B" })).toBe(
      1,
    );
  });

  it("scopes aggregations", async () => {
    const titles = await notes("ws_b")
      .aggregate([{ $project: { _id: 0, title: 1 } }])
      .toArray();
    expect(titles).toEqual([{ title: "Secret of B" }]);
  });

  it("upserts with createdAt only on insert", async () => {
    const ws = notes("ws_upsert");
    await ws.updateOne({}, { $set: { title: "v1" } }, { upsert: true });
    const first = await ws.findOne();
    await new Promise((r) => setTimeout(r, 5));
    await ws.updateOne({}, { $set: { title: "v2" } }, { upsert: true });
    const second = await ws.findOne();
    expect(second).toMatchObject({ workspaceId: "ws_upsert", title: "v2" });
    expect(second?.createdAt).toEqual(first?.createdAt);
    expect(second!.updatedAt.getTime()).toBeGreaterThan(
      first!.updatedAt.getTime(),
    );
  });

  it("moves a status atomically: only one of two racing calls wins", async () => {
    const ws = notes("ws_race");
    const { insertedId } = await ws.insertOne({
      title: "CR-001",
      status: "sent",
    });
    const approve = () =>
      ws.findOneAndUpdate(
        { _id: insertedId, status: "sent" },
        { $set: { status: "approved" } },
      );
    const results = await Promise.all([approve(), approve()]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("refuses to build without a workspaceId", () => {
    expect(() => notes("")).toThrow(/needs a workspaceId/);
  });
});

describe("withTransaction", () => {
  it("commits all writes together", async () => {
    await withTransaction(async (session) => {
      await notes("ws_tx").insertOne({ title: "one" }, { session });
      await notes("ws_tx").insertOne({ title: "two" }, { session });
    });
    expect(await notes("ws_tx").countDocuments()).toBe(2);
  });

  it("rolls everything back when any step fails", async () => {
    await expect(
      withTransaction(async (session) => {
        await notes("ws_tx_fail").insertOne({ title: "one" }, { session });
        throw new Error("payment line failed");
      }),
    ).rejects.toThrow("payment line failed");
    expect(await notes("ws_tx_fail").countDocuments()).toBe(0);
  });
});
