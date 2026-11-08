"use server";

import { randomUUID } from "node:crypto";
import type { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/modules/activity/server";
import { clientFirstName } from "@/modules/clients";
import { getDocumentSettings } from "@/modules/documents/server";
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
import { currentProposalData } from "./document";
import { newPortalLink } from "./portal";
import * as repo from "./repository";
import { getProjectOrNotFound } from "./queries";

export type ProjectFormState = FormState<ProjectField | "id">;

const objectIdField = z.string().transform((value, ctx) => {
  const id = parseObjectId(value);
  if (!id) {
    ctx.addIssue({ code: "custom", message: "This project doesn't exist." });
    return z.NEVER;
  }
  return id;
});

const member = (user: { id: string; name: string }) =>
  ({ kind: "member", userId: user.id, name: user.name }) as const;

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

export const createProject = workspaceAction(
  {
    fields: PROJECT_FIELDS,
    schema: projectInputSchema,
    failureMessage: "The project wasn't saved. Please try again.",
  },
  async (input, { workspace, user }) => {
    const data = await toProjectData(input);
    const id = await repo.insertProject(workspace.workspaceId, data);
    await logActivity(workspace.workspaceId, {
      projectId: parseObjectId(id) as ObjectId,
      type: "project.created",
      actor: member(user),
    });
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

// ── Sending to the client ──────────────────────────────────────────────────

const VERIFY_FIRST =
  "Confirm your email address first, using the code we sent you (see the banner at the top). Clients see your email on the proposal.";

const idOnly = {
  fields: ["id"] as const,
  schema: z.object({ id: objectIdField }),
};

/**
 * Draft → waiting for the client. Freezes the proposal exactly as shown
 * (including default text), so later edits to settings can't change what
 * the client is approving. Creates the client link on the first send; a
 * re-send after changes keeps the same link.
 */
export const sendProposal = workspaceAction(
  { ...idOnly, failureMessage: "The proposal wasn't sent. Please try again." },
  async ({ id }, context) => {
    if (!context.user.emailVerified) throw new UserError(VERIFY_FIRST);
    const project = await getProjectOrNotFound(id.toHexString());
    if (project.status !== "draft") {
      throw new UserError(
        "This proposal has already been sent. Refresh the page to see where it is.",
      );
    }
    if (!project.client) {
      throw new UserError(
        "This project's client was removed. Edit the project and choose a client first.",
      );
    }
    const [settings, state] = await Promise.all([
      getDocumentSettings(),
      repo.findPortalState(context.workspace.workspaceId, id),
    ]);
    const now = new Date();
    const data = {
      ...currentProposalData(project, context, settings.defaults),
      issuedOn: now,
    };
    const sent = await repo.markSent(
      context.workspace.workspaceId,
      id,
      {
        data,
        sentAt: now,
        sentBy: { userId: context.user.id, email: context.user.email },
      },
      state?.portal ? null : newPortalLink(),
    );
    if (!sent) {
      throw new UserError(
        "This proposal has already been sent. Refresh the page to see where it is.",
      );
    }
    await logActivity(context.workspace.workspaceId, {
      projectId: id,
      type: "proposal.sent",
      at: now,
      actor: member(context.user),
      data: { amount: data.total, currency: data.currency },
    });
    refresh();
    return {
      message: `Sent. Share the link with ${clientFirstName(project.client)} on WhatsApp or email.`,
    };
  },
);

/** Waiting → draft so it can be edited. The client sees "being updated". */
export const withdrawProposal = workspaceAction(
  {
    ...idOnly,
    failureMessage: "The proposal wasn't withdrawn. Please try again.",
  },
  async ({ id }, { workspace, user }) => {
    const done = await repo.markWithdrawn(workspace.workspaceId, id);
    if (!done) {
      throw new UserError(
        "The client has already answered, or the proposal was withdrawn. Refresh the page.",
      );
    }
    await logActivity(workspace.workspaceId, {
      projectId: id,
      type: "proposal.withdrawn",
      actor: member(user),
    });
    refresh();
    return { message: "Withdrawn. Edit the scope, then send it again." };
  },
);

/** A new link; the old one stops working at once (e.g. sent to the wrong person). */
export const regeneratePortalLink = workspaceAction(
  { ...idOnly, failureMessage: "No new link was made. Please try again." },
  async ({ id }, { workspace, user }) => {
    if (!user.emailVerified) throw new UserError(VERIFY_FIRST);
    const state = await repo.findPortalState(workspace.workspaceId, id);
    if (!state) throw new UserError(GONE);
    if (!state.portal) {
      throw new UserError("Send the proposal first. That creates the link.");
    }
    await repo.replacePortal(workspace.workspaceId, id, newPortalLink());
    await logActivity(workspace.workspaceId, {
      projectId: id,
      type: "link.replaced",
      actor: member(user),
    });
    refresh();
    return { message: "New link ready. The old link no longer opens." };
  },
);
