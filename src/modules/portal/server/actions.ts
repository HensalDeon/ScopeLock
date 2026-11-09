"use server";

import { refresh } from "next/cache";
import { logActivityInTransaction } from "@/modules/activity/server";
import { recordDecision } from "@/modules/approvals/server";
import { applyDecision } from "@/modules/projects/server";
import { withTransaction } from "@/shared/db/transaction";
import { formatMoney, minor } from "@/shared/lib/money";
import { decisionEmail } from "./emails";
import {
  failure,
  notify,
  prepare,
  projectUrl,
  StaleDecision,
  type DecisionState,
} from "./decision-helpers";

export type { DecisionState } from "./decision-helpers";

/** The client approves the proposal or asks for changes. */
export async function decideProposal(
  token: string,
  _previous: DecisionState,
  formData: FormData,
): Promise<DecisionState> {
  const prepared = await prepare(token, formData);
  if (!("found" in prepared)) return prepared;
  const { input, tokenHash, ip, userAgent, found } = prepared;
  const { workspaceId, project, sent, projectId } = found;
  if (!sent || project.status !== "awaiting_approval") {
    return failure(new StaleDecision(), formData);
  }
  const decidedAt = new Date();
  const amount = { amount: sent.data.total, currency: sent.data.currency };

  try {
    await withTransaction(async (session) => {
      const approvalId = await recordDecision(
        {
          workspaceId,
          projectId,
          subject: { type: "baseline", id: project.id },
          decision: input,
          decidedAt,
          // From the database: the proposal exactly as it was sent.
          snapshot: sent.data as unknown as Record<string, unknown>,
          ip,
          userAgent,
        },
        session,
      );
      const applied = await applyDecision(
        {
          workspaceId,
          projectId,
          tokenHash,
          sentAt: sent.sentAt,
          decision: input.decision,
          approvalId,
          at: decidedAt,
          name: input.name,
          email: input.email,
          comment: input.comment,
        },
        session,
      );
      if (!applied) throw new StaleDecision();
      await logActivityInTransaction(
        workspaceId,
        {
          projectId,
          type:
            input.decision === "approved"
              ? "proposal.approved"
              : "proposal.changes_requested",
          at: decidedAt,
          actor: { kind: "client", name: input.name, email: input.email },
          data: { ...amount, comment: input.comment },
        },
        session,
      );
    });
  } catch (error) {
    return failure(error, formData);
  }

  await notify(
    sent.sentBy.email,
    decisionEmail({
      decision: input.decision,
      projectTitle: sent.data.title,
      reference: sent.data.reference,
      total: formatMoney(minor(sent.data.total), sent.data.currency),
      clientName: input.name,
      clientEmail: input.email,
      comment: input.comment,
      at: decidedAt,
      projectUrl: projectUrl(project.id),
    }),
  );
  refresh();
  return {
    status: "success",
    message:
      input.decision === "approved"
        ? "Approved. Thank you."
        : "Sent. You'll get the updated proposal at this same link.",
  };
}
