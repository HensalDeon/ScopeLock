import "server-only";
import { cache } from "react";
import type { ObjectId } from "mongodb";
import { parseObjectId } from "@/shared/db/ids";
import type {
  ProposalDefaults,
  ProposalDocumentData,
} from "@/modules/documents";
import {
  getDocumentImages,
  getDocumentSettings,
} from "@/modules/documents/server";
import { gstOnDocuments } from "@/modules/invoices/server";
import { BUSINESS_TYPE_LABELS } from "@/modules/workspace";
import {
  requireWorkspace,
  type WorkspaceContext,
} from "@/modules/workspace/server";
import { paymentTimings } from "../domain/payment-timing";
import { type Project } from "../domain/project";
import { getProjectOrNotFound, type ProjectWithClient } from "./queries";
import { findPortalState } from "./portal-repository";

/** Short, readable reference for a project's documents: "P-1F107C". */
export function projectReference(project: Pick<Project, "id">): string {
  return `P-${project.id.slice(-6).toUpperCase()}`;
}

/**
 * The proposal document for a project plus the workspace's document style,
 * for "Preview as client". Once sent, it's the proposal exactly as sent
 * (what the client sees and approves); drafts render from current data.
 */
async function loadGetProposalDocument(projectId: string) {
  const [project, context, settings] = await Promise.all([
    getProjectOrNotFound(projectId),
    requireWorkspace(),
    getDocumentSettings(),
  ]);
  const gst =
    project.status === "draft"
      ? await gstOnDocuments(context.workspace.workspaceId, project.client)
      : null;
  const sent =
    project.status === "draft"
      ? null
      : (
          await findPortalState(
            context.workspace.workspaceId,
            parseObjectId(project.id) as ObjectId,
          )
        )?.sent;
  return {
    project,
    style: settings.style,
    images: await getDocumentImages(settings),
    data:
      sent?.data ??
      currentProposalData(project, context, settings.defaults, gst),
  };
}

/** The proposal as it would be sent right now. */
export function currentProposalData(
  project: ProjectWithClient,
  { workspace, user }: Pick<WorkspaceContext, "workspace" | "user">,
  defaults: ProposalDefaults,
  gstPercent: number | null = null,
): ProposalDocumentData {
  return {
    ...toProposalDocument(
      project,
      documentBusiness({ workspace, user }),
      defaults,
    ),
    gstPercent,
  };
}

/** The business details every client document shows (proposal, CRs). */
export function documentBusiness({
  workspace,
  user,
}: Pick<
  WorkspaceContext,
  "workspace" | "user"
>): ProposalDocumentData["business"] & {
  voice: "I" | "we";
} {
  return {
    name: workspace.businessName,
    tagline: BUSINESS_TYPE_LABELS[workspace.businessType].title,
    email: user.email,
    phone: workspace.phone,
    voice: workspace.businessType === "freelancer" ? "I" : "we",
  };
}

/**
 * `defaults` fill in terms, exclusions and client needs for projects whose
 * proposal was never saved (created before proposal sections existed).
 */
export function toProposalDocument(
  project: ProjectWithClient,
  business: ProposalDocumentData["business"] & { voice: "I" | "we" },
  defaults?: ProposalDefaults,
): ProposalDocumentData {
  const { voice, ...from } = business;
  const p =
    !project.proposalSaved && defaults
      ? { ...project.proposal, ...defaults }
      : project.proposal;
  const ordered = [...project.milestones].sort((a, b) => a.order - b.order);
  const timings = paymentTimings(ordered.length, p.timeline);
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
    currency: project.currency,
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
    milestones: ordered.map((m, i) => ({
      id: m.id,
      name: m.name,
      percent: m.percent,
      amount: m.baseAmount,
      dueWhen:
        project.billingModel === "milestones"
          ? (timings[i]?.dueWhen ?? null)
          : null,
    })),
    timeline: p.timeline.map((step) => {
      const linked =
        step.isMilestone && step.paymentOrder != null
          ? ordered[step.paymentOrder]
          : undefined;
      return {
        id: step.id,
        phase: step.phase,
        duration: step.duration,
        description: step.description,
        isMilestone: step.isMilestone,
        payment: linked
          ? { name: linked.name, amount: linked.baseAmount }
          : null,
      };
    }),
    addons: p.addons,
    clientProvides: p.clientProvides,
    exclusions: p.exclusions,
    terms: p.terms,
  };
}

/** Cached per request: the page and its title share one lookup. */
export const getProposalDocument = cache(loadGetProposalDocument);
