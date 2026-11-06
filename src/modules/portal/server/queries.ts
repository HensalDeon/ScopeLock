import "server-only";
import type { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import {
  listClientHistory,
  type ActivityItem,
} from "@/modules/activity/server";
import { parseChangeNumber, type ChangeRequest } from "@/modules/changes";
import {
  findChangeDoc,
  findChangeDocs,
  toChange,
} from "@/modules/changes/server";
import type {
  ChangeOrderData,
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
  type PortalProject,
  type SentProposal,
} from "@/modules/projects/server";
import { parseObjectId } from "@/shared/db/ids";
import { hashToken } from "@/shared/lib/token";
import { rateLimit } from "@/shared/security/rate-limit";
import { requestInfo } from "@/shared/security/request-info";

/** Where the proposal stands, from the client's side. */
export type PortalState =
  | "awaiting" // waiting for the client's answer
  | "approved"
  | "changes-requested" // client asked for changes; freelancer is editing
  | "updating"; // freelancer withdrew it to make changes

type Opened = PortalProject & { sent: SentProposal; projectId: ObjectId };

/** Page views per IP: generous for a real client, slow for a scraper. */
const VIEW_LIMIT = { limit: 120, windowSeconds: 600 };

/**
 * Every portal page starts here. Unknown, malformed and replaced links all
 * end in the same notFound(), so the page never says which one it was.
 */
async function openPortal(token: string): Promise<Opened | "limited"> {
  if (!PORTAL_TOKEN_PATTERN.test(token)) notFound();
  const { ip } = await requestInfo();
  const { allowed } = await rateLimit(
    `portal-view:${ip ?? "unknown"}`,
    VIEW_LIMIT,
  );
  if (!allowed) return "limited";
  const found = await findByPortalTokenHash(hashToken(token));
  const projectId = found && parseObjectId(found.project.id);
  if (!found?.sent || !projectId) notFound();
  return { ...found, sent: found.sent, projectId };
}

async function look(workspaceId: string) {
  const settings = await getPortalDocumentSettings(workspaceId);
  return { style: settings.style, images: await getDocumentImages(settings) };
}

export type PortalView =
  | { state: "limited" }
  | {
      state: PortalState;
      data: ProposalDocumentData;
      style: DocumentStyle;
      images: DocumentImages;
      sentAt: Date;
      decision: Project["lastDecision"];
      /** Shared change requests (never unsent drafts), newest first. */
      changes: ChangeRequest[];
      totals: Project["totals"];
      history: ActivityItem[];
    };

export async function getPortalView(token: string): Promise<PortalView> {
  const opened = await openPortal(token);
  if (opened === "limited") return { state: "limited" };
  const { workspaceId, project, sent, projectId } = opened;
  const state = portalState(project, sent.sentAt);
  const [{ style, images }, changeDocs, history] = await Promise.all([
    look(workspaceId),
    state === "approved" ? findChangeDocs(workspaceId, projectId) : [],
    listClientHistory(workspaceId, projectId, sent.data.business.name),
  ]);
  return {
    state,
    data: sent.data,
    style,
    images,
    sentAt: sent.sentAt,
    decision: project.lastDecision,
    changes: changeDocs.filter((d) => d.everSent).map(toChange),
    totals: project.totals,
    history,
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

export type PortalChangeView =
  | { state: "limited" }
  | {
      state: "ok";
      change: ChangeRequest;
      /** Null while the freelancer has it back as a draft. */
      data: ChangeOrderData | null;
      style: DocumentStyle;
      images: DocumentImages;
      businessName: string;
      projectTitle: string;
    };

/** One change request on the portal: /c/[token]/changes/[number]. */
export async function getPortalChange(
  token: string,
  numberParam: string,
): Promise<PortalChangeView> {
  const opened = await openPortal(token);
  if (opened === "limited") return { state: "limited" };
  const number = parseChangeNumber(numberParam);
  if (!number) notFound();
  const doc = await findChangeDoc(opened.workspaceId, opened.projectId, number);
  // Drafts the client never saw don't exist as far as the portal goes.
  if (!doc?.everSent) notFound();
  return {
    state: "ok",
    change: toChange(doc),
    data: doc.status === "draft" ? null : (doc.sent?.data ?? null),
    ...(await look(opened.workspaceId)),
    businessName: opened.sent.data.business.name,
    projectTitle: opened.sent.data.title,
  };
}
