import "server-only";
import { cache } from "react";
import { changeLabel, type ChangeRequest } from "@/modules/changes";
import { listChanges } from "@/modules/changes/server";
import type { ProposalDocumentData } from "@/modules/documents";
import type { ScheduleItem } from "@/modules/payments";
import { getProjectPayments } from "@/modules/payments/server";
import { getProposalDocument } from "@/modules/projects/server";
import { buildStatement, type Statement } from "../domain/statement";

/**
 * A statement from what both sides already load: the proposal as sent,
 * its approval, the change requests and the payment schedule. The app and
 * the portal both build it here, so they can't disagree.
 */
export function statementFrom(input: {
  data: ProposalDocumentData;
  approval: {
    decision: "approved" | "rejected";
    name: string;
    at: Date;
  } | null;
  changes: readonly ChangeRequest[];
  items: readonly ScheduleItem[];
  asOf: Date;
}): Statement {
  const { data } = input;
  return buildStatement({
    business: {
      name: data.business.name,
      email: data.business.email,
      phone: data.business.phone,
    },
    client: data.client
      ? { name: data.client.name, company: data.client.company }
      : null,
    projectTitle: data.title,
    reference: data.reference,
    currency: data.currency,
    agreed: {
      total: data.total,
      approvedBy:
        input.approval?.decision === "approved"
          ? { name: input.approval.name, at: input.approval.at }
          : null,
    },
    changes: input.changes
      .filter((c) => c.everSent)
      .map((c) => ({
        label: changeLabel(c.number),
        title: c.title,
        total: c.total,
        status: c.status,
        decision: c.decision
          ? {
              decision: c.decision.decision,
              name: c.decision.name,
              at: c.decision.at,
            }
          : null,
      })),
    payments: input.items.map((i) => ({
      label: i.label,
      total: i.total,
      tax: i.tax,
      payable: i.payable,
      state: i.state,
      invoiceNumber: i.payment?.invoice?.number ?? null,
      requestedAt: i.payment?.requestedAt ?? null,
      receivedOn: i.payment?.confirmation?.receivedOn ?? null,
    })),
    asOf: input.asOf,
  });
}

/** The statement for a project in the signed-in workspace. */
async function loadStatement(projectId: string): Promise<Statement> {
  const [{ project, data }, changes] = await Promise.all([
    getProposalDocument(projectId),
    listChanges(projectId),
  ]);
  const approved =
    project.status === "active" || project.status === "completed";
  const { items } = approved
    ? await getProjectPayments(project, changes)
    : { items: [] };
  return statementFrom({
    data,
    approval: project.lastDecision,
    changes,
    items,
    asOf: new Date(),
  });
}

/** Cached per request: the page and its title share one lookup. */
export const getStatement = cache(loadStatement);
