import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import * as repo from "./repository";

const rahul = {
  name: "Rahul Mehta",
  company: "Mehta Interiors",
  email: "rahul@mehtainteriors.in",
  phone: "+919876543210",
  currency: null,
};

describe("clients repository", () => {
  it("adds, reads and updates a client within its workspace", async () => {
    const id = await repo.insertClient("ws_a", rahul);
    const oid = new ObjectId(id);
    expect(await repo.findClient("ws_a", oid)).toMatchObject({
      id,
      ...rahul,
      archivedAt: null,
    });
    expect(await repo.findClient("ws_b", oid)).toBeNull();

    expect(
      await repo.updateClient("ws_b", oid, { ...rahul, name: "Hijacked" }),
    ).toBe(false);
    expect(
      await repo.updateClient("ws_a", oid, { ...rahul, company: null }),
    ).toBe(true);
    expect((await repo.findClient("ws_a", oid))?.company).toBeNull();
  });

  it("lists by name, case-insensitively, and separates archived clients", async () => {
    const ws = "ws_list";
    await repo.insertClient(ws, { ...rahul, name: "zara Khan" });
    const asha = await repo.insertClient(ws, { ...rahul, name: "Asha Rao" });
    await repo.insertClient(ws, { ...rahul, name: "Bilal Shaikh" });

    expect((await repo.findClients(ws)).map((c) => c.name)).toEqual([
      "Asha Rao",
      "Bilal Shaikh",
      "zara Khan",
    ]);

    expect(await repo.setClientArchived(ws, new ObjectId(asha), true)).toBe(
      true,
    );
    expect((await repo.findClients(ws)).map((c) => c.name)).toEqual([
      "Bilal Shaikh",
      "zara Khan",
    ]);
    expect((await repo.findClients(ws, { archived: true }))[0]?.name).toBe(
      "Asha Rao",
    );
    expect(await repo.countActiveClients(ws)).toBe(2);

    // Archived clients still resolve by id (old projects keep their name).
    const byId = await repo.findClientsByIds(ws, [new ObjectId(asha)]);
    expect(byId[0]?.archivedAt).toBeInstanceOf(Date);

    await repo.setClientArchived(ws, new ObjectId(asha), false);
    expect(await repo.countActiveClients(ws)).toBe(3);
  });

  it("pages clients A–Z, active and archived separately", async () => {
    const ws = "ws_client_pages";
    for (const name of [
      "Zara Khan",
      "arjun Rao",
      "Meera Iyer",
      "Bilal Shaikh",
    ]) {
      await repo.insertClient(ws, { ...rahul, name });
    }
    const firstPage = await repo.findClients(ws, {}, { skip: 0, limit: 2 });
    const secondPage = await repo.findClients(ws, {}, { skip: 2, limit: 2 });
    expect([...firstPage, ...secondPage].map((c) => c.name)).toEqual([
      "arjun Rao",
      "Bilal Shaikh",
      "Meera Iyer",
      "Zara Khan",
    ]);
    expect(await repo.countClients(ws)).toBe(4);
    expect(await repo.countClients(ws, { archived: true })).toBe(0);
  });
});
