import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { collection } from "@/shared/db/collections";
import { minor } from "@/shared/lib/money";
import { buildProjectPlan, projectInputSchema } from "../domain/project-input";
import { emptyTotals } from "../domain/project";
import * as repo from "./repository";

let n = 0;
const newId = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;

function rahulsProject(clientId = new ObjectId()): repo.ProjectData {
  const input = projectInputSchema.parse({
    clientId: clientId.toHexString(),
    currency: "INR",
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
    currency: input.currency,
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

  it("knows whether a project's proposal was ever saved", async () => {
    const ws = "ws_legacy";
    const id = new ObjectId(await repo.insertProject(ws, rahulsProject()));
    expect((await repo.findProject(ws, id))?.proposalSaved).toBe(true);

    // A project created before proposal sections existed has no field.
    await collection("projects").updateOne(
      { _id: id },
      { $unset: { proposal: "" } },
    );
    const legacy = await repo.findProject(ws, id);
    expect(legacy?.proposalSaved).toBe(false);
    expect(legacy?.proposal.terms).toEqual([]);
  });

  it("pages projects newest first, with counts per client", async () => {
    const ws = "ws_pages";
    const a = new ObjectId();
    const b = new ObjectId();
    for (let i = 0; i < 5; i++) {
      await repo.insertProject(ws, {
        ...rahulsProject(i < 3 ? a : b),
        name: `P${i}`,
      });
      await new Promise((r) => setTimeout(r, 3));
    }
    const first = await repo.findProjects(ws, {}, { skip: 0, limit: 2 });
    const second = await repo.findProjects(ws, {}, { skip: 2, limit: 2 });
    const last = await repo.findProjects(ws, {}, { skip: 4, limit: 2 });
    expect([...first, ...second, ...last].map((p) => p.name)).toEqual([
      "P4",
      "P3",
      "P2",
      "P1",
      "P0",
    ]);
    expect(await repo.countProjects(ws, { clientId: a })).toBe(3);
    const counts = await repo.countProjectsByClient(ws);
    expect([counts.get(a.toHexString()), counts.get(b.toHexString())]).toEqual([
      3, 2,
    ]);
    expect((await repo.countProjectsByClient("ws_other")).size).toBe(0);
  });

  it("summarises projects without the heavy fields", async () => {
    const ws = "ws_summary";
    await repo.insertProject(ws, rahulsProject());
    const [summary] = await repo.findProjectSummaries(ws);
    expect(summary).toMatchObject({
      name: "Website redesign",
      status: "draft",
      baselineTotal: 8_000_000,
      changeCount: 0,
    });
    expect(summary).not.toHaveProperty("baseline");
    expect(summary).not.toHaveProperty("proposal");
  });
});

describe("archiving projects", () => {
  it("waits for the client, then stops counting and can be restored", async () => {
    const ws = "ws_archive";
    const id = new ObjectId(await repo.insertProject(ws, rahulsProject()));
    await repo.insertProject(ws, rahulsProject());
    expect(await repo.countActiveProjects(ws)).toBe(2);

    // A payment is still owed: archiving doesn't match.
    await repo.setPaymentTotals(ws, id, {
      paid: minor(0),
      due: minor(2_400_000),
    });
    expect(await repo.setProjectArchived(ws, id, true)).toBe(false);

    await repo.setPaymentTotals(ws, id, {
      paid: minor(2_400_000),
      due: minor(0),
    });
    expect(await repo.setProjectArchived(ws, id, true)).toBe(true);
    expect(await repo.countActiveProjects(ws)).toBe(1);
    expect((await repo.findProject(ws, id))?.archivedAt).toBeInstanceOf(Date);
    expect(await repo.countProjects(ws, { archived: true })).toBe(1);
    // Already archived: a second archive changes nothing.
    expect(await repo.setProjectArchived(ws, id, true)).toBe(false);

    expect(await repo.setProjectArchived(ws, id, false)).toBe(true);
    expect(await repo.countActiveProjects(ws)).toBe(2);
    expect((await repo.findProject(ws, id))?.archivedAt).toBe(null);
  });
});
