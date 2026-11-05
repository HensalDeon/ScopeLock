import "server-only";
import type { ProposalDocumentData } from "@/modules/documents";
import { getDocumentSettings } from "@/modules/documents/server";
import { BUSINESS_TYPE_LABELS } from "@/modules/workspace";
import { requireWorkspace } from "@/modules/workspace/server";
import type { Project } from "../domain/project";
import { getProjectOrNotFound, type ProjectWithClient } from "./queries";

/** Short, readable reference for a project's documents: "P-1F107C". */
export function projectReference(project: Pick<Project, "id">): string {
  return `P-${project.id.slice(-6).toUpperCase()}`;
}

/**
 * The proposal document for a project, as the client will see it, plus the
 * workspace's document style. Used by "Preview as client" now and by the
 * client portal and the approval snapshot in Phase 3B.
 */
export async function getProposalDocument(projectId: string) {
  const [project, { workspace, user }, settings] = await Promise.all([
    getProjectOrNotFound(projectId),
    requireWorkspace(),
    getDocumentSettings(),
  ]);
  return {
    project,
    style: settings.style,
    data: toProposalDocument(project, {
      name: workspace.businessName,
      tagline: BUSINESS_TYPE_LABELS[workspace.businessType].title,
      email: user.email,
      phone: workspace.phone,
      voice: workspace.businessType === "freelancer" ? "I" : "we",
    }),
  };
}

export function toProposalDocument(
  project: ProjectWithClient,
  business: ProposalDocumentData["business"] & { voice: "I" | "we" },
): ProposalDocumentData {
  const { voice, ...from } = business;
  const p = project.proposal;
  return {
    voice,
    business: from,
    client: project.client
      ? {
          name: project.client.name,
          company: project.client.company,
          email: project.client.email,
          phone: project.client.phone,
        }
      : null,
    reference: projectReference(project),
    title: p.title ?? project.name,
    subtitle: p.subtitle ?? project.description,
    issuedOn: project.updatedAt,
    validUntil: p.validUntil
      ? new Date(`${p.validUntil}T00:00:00+05:30`)
      : null,
    overview: p.overview,
    callout: p.callout,
    highlights: p.highlights,
    items: project.baseline.items,
    total: project.baseline.total,
    billingModel: project.billingModel,
    milestones: project.milestones.map((m) => ({
      id: m.id,
      name: m.name,
      percent: m.percent,
      amount: m.baseAmount,
    })),
    timeline: p.timeline,
    addons: p.addons,
    clientProvides: p.clientProvides,
    exclusions: p.exclusions,
    terms: p.terms,
  };
}
