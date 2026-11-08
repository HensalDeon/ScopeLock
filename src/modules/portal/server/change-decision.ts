"use server";

import { refresh } from "next/cache";
import { logActivityInTransaction } from "@/modules/activity/server";
import { recordDecision } from "@/modules/approvals/server";
import { closedKeys } from "@/modules/payments";
import { findPaymentDocs, toPayment } from "@/modules/payments/server";
import { changeLabel, placeChange } from "@/modules/changes";
import {
  applyChangeDecision,
  findChangeDoc,
  refreshChangeTotals,
} from "@/modules/changes/server";
import { withTransaction } from "@/shared/db/transaction";
import { env } from "@/shared/lib/env";
import { formatMoney, minor } from "@/shared/lib/money";
import { changeDecisionEmail } from "./emails";
import {
  failure,
  notify,
  prepare,
  StaleDecision,
  type DecisionState,
} from "./decision-helpers";

/** The client approves or declines a change request. */
export async function decideChange(
  token: string,
  number: number,
  _previous: DecisionState,
  formData: FormData,
): Promise<DecisionState> {
  const prepared = await prepare(token, formData);
  if (!("found" in prepared)) return prepared;
  const { input, ip, userAgent, found } = prepared;
  const { workspaceId, project, projectId } = found;
  if (project.status !== "active" || !Number.isSafeInteger(number)) {
    return failure(new StaleDecision(), formData);
  }
  const change = await findChangeDoc(workspaceId, projectId, number);
  const sent = change?.sent;
  if (!change || !sent || change.status !== "sent") {
    return failure(new StaleDecision(), formData);
  }
  const decidedAt = new Date();
  const label = changeLabel(change.number);

  try {
    await withTransaction(async (session) => {
      const approvalId = await recordDecision(
        {
          workspaceId,
          projectId,
          subject: { type: "change_request", id: change._id.toHexString() },
          decision: input,
          decidedAt,
          // From the database: the change order exactly as it was sent.
          snapshot: sent.data as unknown as Record<string, unknown>,
          ip,
          userAgent,
        },
        session,
      );
      // Where the money goes, fixed now: never into a payment already
      // requested (it moves to the next open one, or a separate payment).
      const placement =
        input.decision === "approved"
          ? placeChange(
              minor(change.total),
              change.billing,
              project.milestones,
              closedKeys(
                (await findPaymentDocs(workspaceId, projectId, session)).map(
                  toPayment,
                ),
              ),
            )
          : null;
      const applied = await applyChangeDecision(
        {
          workspaceId,
          id: change._id,
          placement,
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
      await refreshChangeTotals(workspaceId, projectId, session);
      await logActivityInTransaction(
        workspaceId,
        {
          projectId,
          type:
            input.decision === "approved"
              ? "change.approved"
              : "change.rejected",
          at: decidedAt,
          actor: { kind: "client", name: input.name, email: input.email },
          data: {
            label,
            title: change.title,
            amount: change.total,
            currency: change.currency,
            comment: input.comment,
          },
        },
        session,
      );
    });
  } catch (error) {
    return failure(error, formData);
  }

  await notify(
    sent.sentBy.email,
    changeDecisionEmail({
      decision: input.decision,
      label,
      title: change.title,
      projectTitle: sent.data.projectTitle,
      total: formatMoney(minor(change.total), change.currency),
      billing: sent.data.billing,
      clientName: input.name,
      clientEmail: input.email,
      comment: input.comment,
      at: decidedAt,
      url: new URL(
        `/projects/${project.id}/changes/${change.number}`,
        env().APP_URL,
      ).toString(),
    }),
  );
  refresh();
  return {
    status: "success",
    message:
      input.decision === "approved"
        ? "Approved. Thank you."
        : "Sent. Your answer has been passed on.",
  };
}
