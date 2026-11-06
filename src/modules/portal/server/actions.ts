"use server";

import { MongoServerError } from "mongodb";
import { refresh } from "next/cache";
import {
  DECISION_FIELDS,
  decisionInputSchema,
  type DecisionField,
} from "@/modules/approvals";
import { recordDecision } from "@/modules/approvals/server";
import {
  applyDecision,
  findByPortalTokenHash,
  PORTAL_TOKEN_PATTERN,
} from "@/modules/projects/server";
import { parseObjectId } from "@/shared/db/ids";
import { withTransaction } from "@/shared/db/transaction";
import { sendEmail } from "@/shared/email";
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
import { decisionEmail } from "./emails";

export type DecisionState = FormState<DecisionField>;

const NOT_WAITING =
  "This proposal isn't waiting for an answer any more. Refresh the page to see where it stands.";

class StaleDecision extends Error {}

/**
 * The client approves the proposal or asks for changes. Public (no sign-in):
 * everything is worked out from the link's token, never from ids in the
 * request. The evidence record and the status change commit together or
 * not at all; a unique index stops a second approval.
 */
export async function decideProposal(
  token: string,
  _previous: DecisionState,
  formData: FormData,
): Promise<DecisionState> {
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
  const input = parsed.data;

  const found = await findByPortalTokenHash(tokenHash);
  const projectId = found && parseObjectId(found.project.id);
  if (
    !found?.sent ||
    !projectId ||
    found.project.status !== "awaiting_approval"
  ) {
    return fail(NOT_WAITING);
  }
  const { workspaceId, project, sent } = found;
  const decidedAt = new Date();

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
    });
  } catch (error) {
    if (error instanceof StaleDecision) return fail(NOT_WAITING);
    if (error instanceof MongoServerError && error.code === 11000) {
      return fail("This proposal is already approved. Refresh the page.");
    }
    console.error("[portal] decision failed", error);
    return fail("Your answer wasn't saved. Please try again in a minute.");
  }

  // Outside the transaction (it can retry); a failed email never undoes the
  // decision.
  try {
    const email = decisionEmail({
      decision: input.decision,
      projectTitle: sent.data.title,
      reference: sent.data.reference,
      total: formatMoney(minor(sent.data.total), sent.data.currency),
      clientName: input.name,
      clientEmail: input.email,
      comment: input.comment,
      at: decidedAt,
      projectUrl: new URL(`/projects/${project.id}`, env().APP_URL).toString(),
    });
    await sendEmail({ to: sent.sentBy.email, ...email });
  } catch (error) {
    console.error("[portal] decision email failed", error);
  }

  refresh();
  return {
    status: "success",
    message:
      input.decision === "approved"
        ? "Approved. Thank you."
        : "Sent. You'll get the updated proposal at this same link.",
  };
}
