/**
 * Projects module: server-only API for pages and other modules' server code.
 */
import "server-only";

export {
  countProjects,
  countProjectsByClient,
  findProjectWithClient,
  getProjectOrNotFound,
  listProjects,
  getShareState,
  listProjectsForClient,
  listProjectSummaries,
  type ProjectSummaryWithClient,
  type ProjectWithClient,
  type ShareState,
} from "./server/queries";
// For the changes and portal modules (repository level, workspace given).
export {
  nextChangeNumber,
  setChangeTotals,
  applyDecision,
  findByPortalTokenHash,
  type PortalProject,
  type SentProposal,
} from "./server/repository";
export { PORTAL_TOKEN_PATTERN } from "./server/portal";
export {
  documentBusiness,
  getProposalDocument,
  projectReference,
  toProposalDocument,
} from "./server/document";
