import "server-only";
import type { ChangeOrderData } from "@/modules/documents";
import {
  documentBusiness,
  projectReference,
  type ProjectWithClient,
} from "@/modules/projects/server";
import type { WorkspaceContext } from "@/modules/workspace/server";
import { billingSummary, changeLabel } from "../domain/change-request";
import type { ChangeData } from "./repository";

/** The change order as it would be sent right now. */
export function changeOrderData(
  project: ProjectWithClient,
  change: ChangeData & { number: number },
  context: Pick<WorkspaceContext, "workspace" | "user">,
  issuedOn: Date = new Date(),
): ChangeOrderData {
  const { voice, ...business } = documentBusiness(context);
  return {
    voice,
    business,
    client: project.client
      ? {
          name: project.client.name,
          company: project.client.company,
          email: project.client.email,
          phone: project.client.phone,
        }
      : null,
    reference: changeLabel(change.number),
    projectReference: projectReference(project),
    projectTitle: project.proposal.title ?? project.name,
    currency: project.currency,
    title: change.title,
    description: change.description,
    items: change.items,
    total: change.total as ChangeOrderData["total"],
    billing: billingSummary(change.billing, project.milestones),
    originalTotal: project.baseline.total,
    issuedOn,
  };
}
