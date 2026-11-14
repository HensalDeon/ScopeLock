import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { collection } from "@/shared/db/collections";
import {
  addWorkspaceMember,
  getWorkspaceRole,
  listUserWorkspaces,
  listWorkspaceMembers,
  removeWorkspaceMember,
  setWorkspaceMemberRole,
} from "./membership";

async function person(name: string) {
  const _id = new ObjectId();
  await collection("user").insertOne({
    _id,
    name,
    email: `${name.toLowerCase()}@studio.in`,
    emailVerified: true,
  });
  return _id.toHexString();
}

async function workspace(ownerId: string) {
  const ws = new ObjectId();
  await collection("member").insertOne({
    organizationId: ws,
    userId: new ObjectId(ownerId),
    role: "owner",
    createdAt: new Date("2026-11-01"),
  });
  return ws.toHexString();
}

describe("team membership", () => {
  it("adds, lists, changes and removes members; the owner stays", async () => {
    const asha = await person("Asha");
    const priya = await person("Priya");
    const ws = await workspace(asha);

    expect(await addWorkspaceMember(ws, priya, "member")).toBe(true);
    expect(await addWorkspaceMember(ws, priya, "member")).toBe(false);
    const members = await listWorkspaceMembers(ws);
    expect(members.map((m) => [m.name, m.role])).toEqual([
      ["Asha", "owner"],
      ["Priya", "member"],
    ]);

    expect(await setWorkspaceMemberRole(ws, priya, "admin")).toBe(true);
    expect(await getWorkspaceRole(priya, ws)).toBe("admin");
    // The owner can't be demoted or removed this way.
    expect(await setWorkspaceMemberRole(ws, asha, "member")).toBe(false);
    expect(await removeWorkspaceMember(ws, asha)).toBe(false);
    expect(await getWorkspaceRole(asha, ws)).toBe("owner");

    expect(await removeWorkspaceMember(ws, priya)).toBe(true);
    expect(await getWorkspaceRole(priya, ws)).toBeNull();
  });

  it("lists every workspace someone belongs to", async () => {
    const ravi = await person("Ravi");
    const own = await workspace(ravi);
    const agency = await workspace(await person("Owner"));
    await addWorkspaceMember(agency, ravi, "member");
    const mine = await listUserWorkspaces(ravi);
    expect(mine.map((w) => [w.workspaceId, w.role])).toEqual([
      [own, "owner"],
      [agency, "member"],
    ]);
  });
});
