"use server";

import { MongoServerError, type ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { logActivityInTransaction } from "@/modules/activity/server";
import {
  DECISION_FIELDS,
  decisionInputSchema,
  type DecisionField,
  type DecisionInput,
} from "@/modules/approvals";
import { recordDecision } from "@/modules/approvals/server";
import { changeLabel } from "@/modules/changes";
import {
  applyChangeDecision,
  findChangeDoc,
  refreshChangeTotals,
} from "@/modules/changes/server";
import {
  applyDecision,
  findByPortalTokenHash,
  PORTAL_TOKEN_PATTERN,
  type PortalProject,
} from "@/modules/projects/server";
import { parseObjectId } from "@/shared/db/ids";
import { withTransaction } from "@/shared/db/transaction";
import { sendEmail, type EmailContent } from "@/shared/email";
import { env } from "@/shared/lib/env";
import {
  fieldErrorsFrom,
  readFields,
  type FormState,
} from "@/shared/lib/form-state";
import { formatMoney, minor } from "@/shared/lib/money";
import { hashToken } from "@/shared/lib/token";
import { rateLimit } from "@/shared/security/rate-limit";
import { requestInfo } from "@/shared/security/request-info";
import { changeDecisionEmail, decisionEmail } from "./emails";

export type DecisionState = FormState<DecisionField>;

const NOT_WAITING =
  "This isn't waiting for an answer any more. Refresh the page to see where it stands.";

class StaleDecision extends Error {}

type Prepared = {
  input: DecisionInput;
  tokenHash: string;
  ip: string | null;
  userAgent: string | null;
  found: PortalProject & { projectId: ObjectId };
};

/**
 * Shared start of every client decision: token format, rate limits, the
 * form, and the project found from the token alone (never from ids in the
 * request).
 */
async function prepare(
  token: string,
  formData: FormData,
): Promise<Prepared | DecisionState> {
  const values = readFields(formData, DECISION_FIELDS);
  const fail = (message: string): DecisionState => ({
    status: "error",
    message,
    values,
  });
  if (typeof token !== "string" || !PORTAL_TOKEN_PATTERN.test(token)) {
    return fail(NOT_WAITING);
  }
  const tokenHash = hashToken(token);
  const { ip, userAgent } = await requestInfo();
  const [byIp, byLink] = await Promise.all([
    rateLimit(`portal-decide-ip:${ip ?? "unknown"}`, {
      limit: 10,
      windowSeconds: 600,
    }),
    rateLimit(`portal-decide-link:${tokenHash}`, {
      limit: 20,
      windowSeconds: 3600,
    }),
  ]);
  if (!byIp.allowed || !byLink.allowed) {
    return fail("Too many tries from here. Wait 10 minutes and try again.");
  }
  const parsed = decisionInputSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: fieldErrorsFrom<DecisionField>(parsed.error.issues),
      values,
    };
  }
  const found = await findByPortalTokenHash(tokenHash);
  const projectId = found && parseObjectId(found.project.id);
  if (!found || !projectId) return fail(NOT_WAITING);
  return {
    input: parsed.data,
    tokenHash,
    ip,
    userAgent,
    found: { ...found, projectId },
  };
}

function failure(error: unknown, values: FormData): DecisionState {
  const fail = (message: string): DecisionState => ({
    status: "error",
    message,
    values: readFields(values, DECISION_FIELDS),
  });
  if (error instanceof StaleDecision) return fail(NOT_WAITING);
  if (error instanceof MongoServerError && error.code === 11000) {
    return fail("This is already approved. Refresh the page.");
  }
  console.error("[portal] decision failed", error);
  return fail("Your answer wasn't saved. Please try again in a minute.");
}

/** Outside the transaction (it can retry); a failed email never undoes it. */
async function notify(
  to: string,
  email: { subject: string; content: EmailContent },
) {
  try {
    await sendEmail({ to, ...email });
  } catch (error) {
    console.error("[portal] decision email failed", error);
  }
}

const projectUrl = (id: string) =>
  new URL(`/projects/${id}`, env().APP_URL).toString();

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
      const applied = await applyChangeDecision(
        {
          workspaceId,
          id: change._id,
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
