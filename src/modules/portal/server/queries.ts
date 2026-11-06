import "server-only";
import { notFound } from "next/navigation";
import type {
  DocumentImages,
  DocumentStyle,
  ProposalDocumentData,
} from "@/modules/documents";
import {
  getDocumentImages,
  getPortalDocumentSettings,
} from "@/modules/documents/server";
import type { Project } from "@/modules/projects";
import {
  findByPortalTokenHash,
  PORTAL_TOKEN_PATTERN,
} from "@/modules/projects/server";
import { hashToken } from "@/shared/lib/token";
import { rateLimit } from "@/shared/security/rate-limit";
import { requestInfo } from "@/shared/security/request-info";

/** Where the proposal stands, from the client's side. */
export type PortalState =
  | "awaiting" // waiting for the client's answer
  | "approved"
  | "changes-requested" // client asked for changes; freelancer is editing
  | "updating"; // freelancer withdrew it to make changes

export type PortalView =
  | { state: "limited" }
  | {
      state: PortalState;
      data: ProposalDocumentData;
      style: DocumentStyle;
      images: DocumentImages;
      sentAt: Date;
      decision: Project["lastDecision"];
    };

/** Page views per IP: generous for a real client, slow for a scraper. */
const VIEW_LIMIT = { limit: 120, windowSeconds: 600 };

/**
 * The client portal for a link. Unknown, malformed and replaced links all
 * end in the same notFound(), so the page never says which one it was.
 */
export async function getPortalView(token: string): Promise<PortalView> {
  if (!PORTAL_TOKEN_PATTERN.test(token)) notFound();

  const { ip } = await requestInfo();
  const { allowed } = await rateLimit(
    `portal-view:${ip ?? "unknown"}`,
    VIEW_LIMIT,
  );
  if (!allowed) return { state: "limited" };

  const found = await findByPortalTokenHash(hashToken(token));
  if (!found?.sent) notFound();
  const { project, sent } = found;

  const settings = await getPortalDocumentSettings(found.workspaceId);
  return {
    state: portalState(project, sent.sentAt),
    data: sent.data,
    style: settings.style,
    images: await getDocumentImages(settings),
    sentAt: sent.sentAt,
    decision: project.lastDecision,
  };
}

function portalState(project: Project, sentAt: Date): PortalState {
  if (project.status === "awaiting_approval") return "awaiting";
  if (project.status === "draft") {
    const answeredThisVersion =
      project.lastDecision?.decision === "rejected" &&
      project.lastDecision.at >= sentAt;
    return answeredThisVersion ? "changes-requested" : "updating";
  }
  return "approved";
}
