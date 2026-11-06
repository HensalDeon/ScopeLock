/**
 * Projects module: server-only API for pages and other modules' server code.
 */
import "server-only";

export {
  countProjects,
  getProjectOrNotFound,
  listProjects,
  getShareState,
  listProjectsForClient,
  type ProjectWithClient,
  type ShareState,
} from "./server/queries";
// For the client portal module only (public, token-based).
export {
  applyDecision,
  findByPortalTokenHash,
  type PortalProject,
  type SentProposal,
} from "./server/repository";
export { PORTAL_TOKEN_PATTERN } from "./server/portal";
export {
  getProposalDocument,
  projectReference,
  toProposalDocument,
} from "./server/document";
