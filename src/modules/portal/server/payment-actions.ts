"use server";

import { refresh } from "next/cache";
import {
  REPORT_FIELDS,
  reportInputSchema,
  type ReportField,
} from "@/modules/payments";
import { projectUrlFor, reportFromPortal } from "@/modules/payments/server";
import {
  findByPortalTokenHash,
  PORTAL_TOKEN_PATTERN,
} from "@/modules/projects/server";
import { parseObjectId } from "@/shared/db/ids";
import { todayInIndia } from "@/shared/lib/dates";
import {
  fieldErrorsFrom,
  readFields,
  type FormState,
} from "@/shared/lib/form-state";
import { hashToken } from "@/shared/lib/token";
import { rateLimit } from "@/shared/security/rate-limit";
import { requestInfo } from "@/shared/security/request-info";

export type ReportState = FormState<ReportField>;

const NOT_WAITING =
  "This payment isn't waiting for you any more. Refresh the page.";

/**
 * The client's "I've paid", from their link. Public (no sign-in): the
 * project comes from the token, the payment must belong to it. Rate-limited
 * per connection and per link.
 */
export async function reportPayment(
  token: string,
  paymentId: string,
  _previous: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const values = readFields(formData, REPORT_FIELDS);
  const fail = (message: string): ReportState => ({
    status: "error",
    message,
    values,
  });
  if (typeof token !== "string" || !PORTAL_TOKEN_PATTERN.test(token))
    return fail(NOT_WAITING);
  const id = typeof paymentId === "string" ? parseObjectId(paymentId) : null;
  if (!id) return fail(NOT_WAITING);

  const tokenHash = hashToken(token);
  const { ip } = await requestInfo();
  const [byIp, byLink] = await Promise.all([
    rateLimit(`portal-pay-ip:${ip ?? "unknown"}`, {
      limit: 8,
      windowSeconds: 600,
    }),
    rateLimit(`portal-pay-link:${tokenHash}`, {
      limit: 20,
      windowSeconds: 3600,
    }),
  ]);
  if (!byIp.allowed || !byLink.allowed) {
    return fail("Too many tries from here. Wait 10 minutes and try again.");
  }

  const parsed = reportInputSchema(todayInIndia()).safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: fieldErrorsFrom<ReportField>(parsed.error.issues),
      values,
    };
  }

  const found = await findByPortalTokenHash(tokenHash);
  const projectId = found && parseObjectId(found.project.id);
  if (!found?.sent || !projectId) return fail(NOT_WAITING);

  try {
    const result = await reportFromPortal({
      workspaceId: found.workspaceId,
      projectId,
      paymentId: id,
      report: parsed.data,
      proof: formData.get("proof"),
      client: {
        name: found.sent.data.client?.name ?? "Your client",
        email: found.sent.data.client?.email ?? null,
      },
      freelancerEmail: found.sent.sentBy.email,
      projectName: found.project.name,
      projectUrl: projectUrlFor(found.project.id),
    });
    if (!result.ok) return fail(result.message);
  } catch (error) {
    console.error("[portal] payment report failed", error);
    return fail("That wasn't saved. Please try again in a minute.");
  }
  refresh();
  return {
    status: "success",
    message: "Thanks. It's been sent for confirmation.",
  };
}
