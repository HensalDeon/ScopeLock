import "server-only";
import type { ObjectId } from "mongodb";
import { z } from "zod";
import {
  findProjectWithClient,
  getShareState,
  type ProjectWithClient,
} from "@/modules/projects/server";
import { ARCHIVED_READ_ONLY } from "@/modules/projects";
import { type WorkspaceContext } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import { UserError } from "@/shared/lib/form-state";
import { minor } from "@/shared/lib/money";
import * as repo from "./repository";

/** Shared by the payment actions: input fields, lookups and wording. */

export const idField = (what: string) =>
  z.string().transform((value, ctx) => {
    const id = parseObjectId(value);
    if (!id) {
      ctx.addIssue({ code: "custom", message: `This ${what} doesn't exist.` });
      return z.NEVER;
    }
    return id;
  });

/** What the client pays (amount + GST; older requests have no GST). */
export const payable = (doc: repo.PaymentDoc) =>
  minor(doc.amount + (doc.tax ?? 0));

export const GONE = "This payment doesn't exist any more. Refresh the page.";
export const member = ({ user }: Pick<WorkspaceContext, "user">) =>
  ({ kind: "member", userId: user.id, name: user.name }) as const;

export async function activeProject(
  projectId: ObjectId,
): Promise<ProjectWithClient> {
  const project = await findProjectWithClient(projectId.toHexString());
  if (!project) throw new UserError("This project doesn't exist any more.");
  if (project.archivedAt) throw new UserError(ARCHIVED_READ_ONLY);
  if (project.status !== "active" && project.status !== "completed") {
    throw new UserError(
      "Payments start once your client has approved the proposal.",
    );
  }
  return project;
}

/** The client's page for a payment (or null without a working link). */
export async function paymentUrl(
  project: ProjectWithClient,
  paymentId: string,
) {
  const { url } = await getShareState(project.id);
  return url ? `${url}/pay/${paymentId}` : null;
}

export const byPayment = {
  fields: ["projectId", "paymentId"] as const,
  schema: z.object({
    projectId: idField("project"),
    paymentId: idField("payment"),
  }),
};

export async function ownPayment(
  ws: string,
  projectId: ObjectId,
  paymentId: ObjectId,
) {
  const doc = await repo.findPaymentDoc(ws, projectId, paymentId);
  if (!doc) throw new UserError(GONE);
  return doc;
}
