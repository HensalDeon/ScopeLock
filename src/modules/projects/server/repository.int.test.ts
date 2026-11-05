import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { collection } from "@/shared/db/collections";
import {
  buildProjectPlan,
  emptyTotals,
  projectInputSchema,
} from "../domain/project";
import * as repo from "./repository";

let n = 0;
const newId = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;

function rahulsProject(clientId = new ObjectId()): repo.ProjectData {
  const input = projectInputSchema.parse({
    clientId: clientId.toHexString(),
    name: "Website redesign",
    description: "",
    items: JSON.stringify([
      { title: "Home page", amount: "20000" },
      { title: "About page", amount: "12000" },
      { title: "Services page", amount: "16000" },
      { title: "Portfolio page", amount: "20000" },
      { title: "Contact page", amount: "12000" },
    ]),
    billingModel: "milestones",
    milestones: JSON.stringify([
      { name: "Advance", percent: 30 },
      { name: "Design approved", percent: 30 },
      { name: "Before launch", percent: 40 },
    ]),
  });
  const plan = buildProjectPlan(input, newId);
  return {
    clientId,
    name: input.name,
    description: input.description,
    billingModel: input.billingModel,
    items: plan.items,
    total: plan.total,
    milestones: plan.milestones,
    proposal: plan.proposal,
    totals: emptyTotals(plan.total),
  };
}

describe("projects repository", () => {
  it("stores Rahul's project as a draft with exact paise", async () => {
    const id = await repo.insertProject("ws_a", rahulsProject());
    const project = await repo.findProject("ws_a", new ObjectId(id));
    expect(project).toMatchObject({
      status: "draft",
      currency: "INR",
      baseline: { total: 8_000_000, approvedAt: null },
      totals: { baseline: 8_000_000, paid: 0, due: 0 },
    });
    expect(project?.milestones.map((m) => m.baseAmount)).toEqual([
      2_400_000, 2_400_000, 3_200_000,
    ]);
    expect(await repo.findProject("ws_b", new ObjectId(id))).toBeNull();
  });

  it("filters by client and sorts by latest change", async () => {
    const ws = "ws_list";
    const client = new ObjectId();
    const first = await repo.insertProject(ws, rahulsProject(client));
    await repo.insertProject(ws, rahulsProject());
    await new Promise((r) => setTimeout(r, 5));
    await repo.updateDraftProject(ws, new ObjectId(first), {
      ...rahulsProject(client),
      name: "Website redesign v2",
    });

    expect((await repo.findProjects(ws))[0]?.name).toBe("Website redesign v2");
    expect(await repo.findProjects(ws, { clientId: client })).toHaveLength(1);
    expect(await repo.countProjects(ws)).toBe(2);
  });

  it("only edits and deletes drafts", async () => {
    const ws = "ws_lock";
    const id = new ObjectId(await repo.insertProject(ws, rahulsProject()));

    // Simulate Phase 3 sending it for approval.
    await collection("projects").updateOne(
      { _id: id },
      { $set: { status: "awaiting_approval" } },
    );

    expect(
      await repo.updateDraftProject(ws, id, {
        ...rahulsProject(),
        name: "Changed",
      }),
    ).toBe(false);
    expect(await repo.deleteDraftProject(ws, id)).toBe(false);
    expect((await repo.findProject(ws, id))?.name).toBe("Website redesign");
  });

  it("can't touch another workspace's draft", async () => {
    const id = new ObjectId(
      await repo.insertProject("ws_owner", rahulsProject()),
    );
    expect(await repo.updateDraftProject("ws_other", id, rahulsProject())).toBe(
      false,
    );
    expect(await repo.deleteDraftProject("ws_other", id)).toBe(false);
    expect(await repo.deleteDraftProject("ws_owner", id)).toBe(true);
  });
});
