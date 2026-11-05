"use server";

import { randomUUID } from "node:crypto";
import type { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { z } from "zod";
import { findClient } from "@/modules/clients/server";
import { workspaceAction } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import { UserError, type FormState } from "@/shared/lib/form-state";
import {
  buildProjectPlan,
  emptyTotals,
  PROJECT_FIELDS,
  projectInputSchema,
  type ProjectField,
  type ProjectInput,
} from "../domain/project";
import * as repo from "./repository";

export type ProjectFormState = FormState<ProjectField | "id">;

const objectIdField = z.string().transform((value, ctx) => {
  const id = parseObjectId(value);
  if (!id) {
    ctx.addIssue({ code: "custom", message: "This project doesn't exist." });
    return z.NEVER;
  }
  return id;
});

const LOCKED =
  "This project's scope has been sent for approval, so it can't be changed here. New work goes in a change request.";
const GONE = "This project doesn't exist any more. Refresh the page.";

/** Validates the client belongs to this workspace and turns input into data. */
async function toProjectData(
  input: ProjectInput,
  options: { allowArchivedClientId?: string } = {},
): Promise<repo.ProjectData> {
  const client = await findClient(input.clientId);
  if (!client) {
    throw new UserError("That client doesn't exist. Choose another one.");
  }
  if (client.archivedAt && client.id !== options.allowArchivedClientId) {
    throw new UserError(
      `${client.name} is archived. Restore them on their page first, or choose another client.`,
    );
  }
  const plan = buildProjectPlan(input, randomUUID);
  return {
    clientId: parseObjectId(client.id) as ObjectId,
    name: input.name,
    description: input.description,
    billingModel: input.billingModel,
    items: plan.items,
    total: plan.total,
    milestones: plan.milestones,
    totals: emptyTotals(plan.total),
  };
}

export const createProject = workspaceAction(
  {
    fields: PROJECT_FIELDS,
    schema: projectInputSchema,
    failureMessage: "The project wasn't saved. Please try again.",
  },
  async (input, { workspace }) => {
    const data = await toProjectData(input);
    const id = await repo.insertProject(workspace.workspaceId, data);
    redirect(`/projects/${id}`);
  },
);

export const updateProject = workspaceAction(
  {
    fields: [...PROJECT_FIELDS, "id"],
    schema: projectInputSchema.and(z.object({ id: objectIdField })),
    failureMessage: "Changes weren't saved. Please try again.",
  },
  async ({ id, ...input }, { workspace }) => {
    const existing = await repo.findProject(workspace.workspaceId, id);
    if (!existing) throw new UserError(GONE);
    if (existing.status !== "draft") throw new UserError(LOCKED);
    const data = await toProjectData(input, {
      allowArchivedClientId: existing.clientId,
    });
    // Atomic: fails if the project left draft since we read it.
    const updated = await repo.updateDraftProject(
      workspace.workspaceId,
      id,
      data,
    );
    if (!updated) throw new UserError(LOCKED);
    redirect(`/projects/${id.toHexString()}`);
  },
);

export const deleteProject = workspaceAction(
  {
    fields: ["id"],
    schema: z.object({ id: objectIdField }),
    failureMessage: "The project wasn't deleted. Please try again.",
  },
  async ({ id }, { workspace }) => {
    const deleted = await repo.deleteDraftProject(workspace.workspaceId, id);
    if (!deleted) {
      const existing = await repo.findProject(workspace.workspaceId, id);
      throw new UserError(
        existing
          ? "Only drafts can be deleted. This project has already been sent to the client."
          : GONE,
      );
    }
    redirect("/projects");
  },
);
