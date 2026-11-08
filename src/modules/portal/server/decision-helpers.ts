import "server-only";
import { MongoServerError, type ObjectId } from "mongodb";
import {
  DECISION_FIELDS,
  decisionInputSchema,
  type DecisionField,
  type DecisionInput,
} from "@/modules/approvals";
import {
  findByPortalTokenHash,
  PORTAL_TOKEN_PATTERN,
  type PortalProject,
} from "@/modules/projects/server";
import { parseObjectId } from "@/shared/db/ids";
import { sendEmail, type EmailContent } from "@/shared/email";
import { env } from "@/shared/lib/env";
import {
  fieldErrorsFrom,
  readFields,
  type FormState,
} from "@/shared/lib/form-state";
import { hashToken } from "@/shared/lib/token";
import { rateLimit } from "@/shared/security/rate-limit";
import { requestInfo } from "@/shared/security/request-info";

export type DecisionState = FormState<DecisionField>;

/** Shared by the client's decisions: checks, errors and the notice. */

export const NOT_WAITING =
  "This isn't waiting for an answer any more. Refresh the page to see where it stands.";

/** Thrown inside a transaction when the thing being decided changed meanwhile. */
export class StaleDecision extends Error {}

export type Prepared = {
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
export async function prepare(
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

export function failure(error: unknown, values: FormData): DecisionState {
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
export async function notify(
  to: string,
  email: { subject: string; content: EmailContent },
) {
  try {
    await sendEmail({ to, ...email });
  } catch (error) {
    console.error("[portal] decision email failed", error);
  }
}

export const projectUrl = (id: string) =>
  new URL(`/projects/${id}`, env().APP_URL).toString();
