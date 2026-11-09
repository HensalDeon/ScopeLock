"use server";

import { randomUUID } from "node:crypto";
import type { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logActivity } from "@/modules/activity/server";
import {
  findProjectWithClient,
  getShareState,
  nextChangeNumber,
  type ProjectWithClient,
} from "@/modules/projects/server";
import {
  workspaceAction,
  type WorkspaceContext,
} from "@/modules/workspace/server";
import { gstOnDocuments } from "@/modules/invoices/server";
import { parseObjectId } from "@/shared/db/ids";
import { UserError, type FormState } from "@/shared/lib/form-state";
import {
  CHANGE_FIELDS,
  changeInputSchema,
  changeLabel,
  changeTotal,
  type ChangeField,
  type ChangeInput,
} from "../domain/change-request";
import { changeOrderData } from "./document";
import * as repo from "./repository";
import { refreshChangeTotals } from "./totals";

export type ChangeFormState = FormState<ChangeField | "projectId" | "number">;

const idField = (what: string) =>
  z.string().transform((value, ctx) => {
    const id = parseObjectId(value);
    if (!id) {
      ctx.addIssue({ code: "custom", message: `This ${what} doesn't exist.` });
      return z.NEVER;
    }
    return id;
  });
const numberField = z.coerce.number().int().positive();

const GONE = "This change request doesn't exist any more. Refresh the page.";
const NOT_ACTIVE =
  "Change requests start once the client has approved the proposal.";

async function activeProject(projectId: ObjectId): Promise<ProjectWithClient> {
  const project = await findProjectWithClient(projectId.toHexString());
  if (!project) throw new UserError("This project doesn't exist any more.");
  if (project.status !== "active") throw new UserError(NOT_ACTIVE);
  return project;
}

function toChangeData(input: ChangeInput, project: ProjectWithClient) {
  if (
    input.billingOption === "milestone" &&
    !project.milestones.some((m) => m.id === input.milestoneId)
  ) {
    throw new UserError("That payment isn't on this project. Choose another.");
  }
  const items = input.items.map((item) => ({
    id: item.id ?? randomUUID(),
    title: item.title,
    description: item.description,
    amount: item.amount,
  }));
  return {
    title: input.title,
    description: input.description,
    items,
    total: changeTotal(items),
    billing: {
      option: input.billingOption,
      milestoneId:
        input.billingOption === "milestone" ? input.milestoneId : null,
    },
    source: input.sourceChannel
      ? { channel: input.sourceChannel, note: input.sourceNote }
      : null,
  } satisfies repo.ChangeData;
}

const actor = ({ user }: Pick<WorkspaceContext, "user">) =>
  ({ kind: "member", userId: user.id, name: user.name }) as const;

const eventData = (
  change: { number: number; title: string; total: number },
  project: ProjectWithClient,
) => ({
  label: changeLabel(change.number),
  title: change.title,
  amount: change.total,
  currency: project.currency,
});

async function findOwned(
  workspaceId: string,
  projectId: ObjectId,
  number: number,
) {
  const doc = await repo.findChangeDoc(workspaceId, projectId, number);
  if (!doc) throw new UserError(GONE);
  return doc;
}

export const createChange = workspaceAction(
  {
    fields: [...CHANGE_FIELDS, "projectId"],
    schema: changeInputSchema.and(z.object({ projectId: idField("project") })),
    failureMessage: "The change request wasn't saved. Please try again.",
  },
  async ({ projectId, ...input }, context) => {
    const ws = context.workspace.workspaceId;
    const project = await activeProject(projectId);
    const data = toChangeData(input, project);
    const number = await nextChangeNumber(ws, projectId);
    if (!number) throw new UserError(NOT_ACTIVE);
    await repo.insertChange(ws, {
      projectId,
      number,
      currency: project.currency,
      ...data,
    });
    await logActivity(ws, {
      projectId,
      type: "change.created",
      actor: actor(context),
      data: eventData({ number, ...data }, project),
    });
    redirect(`/projects/${project.id}/changes/${number}`);
  },
);

export const updateChange = workspaceAction(
  {
    fields: [...CHANGE_FIELDS, "projectId", "number"],
    schema: changeInputSchema.and(
      z.object({ projectId: idField("project"), number: numberField }),
    ),
    failureMessage: "Changes weren't saved. Please try again.",
  },
  async ({ projectId, number, ...input }, { workspace }) => {
    const project = await activeProject(projectId);
    const doc = await findOwned(workspace.workspaceId, projectId, number);
    const saved = await repo.updateDraftChange(
      workspace.workspaceId,
      doc._id,
      toChangeData(input, project),
    );
    if (!saved) {
      throw new UserError(
        "This change request has been sent. Take it back first to edit it.",
      );
    }
    redirect(`/projects/${project.id}/changes/${number}`);
  },
);

const byNumber = {
  fields: ["projectId", "number"] as const,
  schema: z.object({ projectId: idField("project"), number: numberField }),
};

export const deleteChange = workspaceAction(
  { ...byNumber, failureMessage: "It wasn't deleted. Please try again." },
  async ({ projectId, number }, context) => {
    const ws = context.workspace.workspaceId;
    const doc = await findOwned(ws, projectId, number);
    if (!(await repo.deleteUnsentDraft(ws, doc._id))) {
      throw new UserError(
        "Your client has seen this change request, so it can't be deleted. Cancel it instead.",
      );
    }
    // So "drafted CR-004" in the history isn't left pointing at nothing.
    await logActivity(ws, {
      projectId,
      type: "change.deleted",
      actor: actor(context),
      data: { label: changeLabel(doc.number), title: doc.title },
    });
    redirect(`/projects/${projectId.toHexString()}`);
  },
);

/** Draft → sent. Freezes the change order; needs a confirmed email and the client link. */
export const sendChange = workspaceAction(
  { ...byNumber, failureMessage: "It wasn't sent. Please try again." },
  async ({ projectId, number }, context) => {
    const ws = context.workspace.workspaceId;
    if (!context.user.emailVerified) {
      throw new UserError(
        "Confirm your email address first, using the code we sent you (see the banner at the top).",
      );
    }
    const project = await activeProject(projectId);
    const share = await getShareState(project.id);
    if (!share.url) {
      throw new UserError(
        "This project has no working client link. Make a new link on the project page first.",
      );
    }
    const doc = await findOwned(ws, projectId, number);
    if (doc.status !== "draft") {
      throw new UserError(
        "This change request was already sent. Refresh the page.",
      );
    }
    const now = new Date();
    const sent = await repo.markChangeSent(ws, doc._id, {
      data: changeOrderData(project, doc, context, {
        issuedOn: now,
        gstPercent: await gstOnDocuments(ws, project.client),
      }),
      sentAt: now,
      sentBy: { userId: context.user.id, email: context.user.email },
    });
    if (!sent) {
      throw new UserError(
        "This change request was already sent. Refresh the page.",
      );
    }
    await refreshChangeTotals(ws, projectId);
    await logActivity(ws, {
      projectId,
      type: "change.sent",
      actor: actor(context),
      data: eventData(doc, project),
    });
    refresh();
    return { message: "Sent. Share the link with your client." };
  },
);

/** Sent → draft, before the client answers. */
export const withdrawChange = workspaceAction(
  { ...byNumber, failureMessage: "It wasn't taken back. Please try again." },
  async ({ projectId, number }, context) => {
    const ws = context.workspace.workspaceId;
    const project = await activeProject(projectId);
    const doc = await findOwned(ws, projectId, number);
    if (!(await repo.markChangeWithdrawn(ws, doc._id))) {
      throw new UserError(
        "Your client has already answered, or it was taken back. Refresh the page.",
      );
    }
    await refreshChangeTotals(ws, projectId);
    await logActivity(ws, {
      projectId,
      type: "change.withdrawn",
      actor: actor(context),
      data: eventData(doc, project),
    });
    refresh();
    return { message: "Taken back. Edit it, then send it again." };
  },
);

/** A draft the client saw before → cancelled for good. */
export const cancelChange = workspaceAction(
  { ...byNumber, failureMessage: "It wasn't cancelled. Please try again." },
  async ({ projectId, number }, context) => {
    const ws = context.workspace.workspaceId;
    const project = await activeProject(projectId);
    const doc = await findOwned(ws, projectId, number);
    if (!(await repo.markChangeCancelled(ws, doc._id))) {
      throw new UserError("Only a change you've taken back can be cancelled.");
    }
    await logActivity(ws, {
      projectId,
      type: "change.cancelled",
      actor: actor(context),
      data: eventData(doc, project),
    });
    refresh();
    return { message: "Cancelled." };
  },
);
