/**
 * Projects module: server-only API for pages and other modules' server code.
 */
import "server-only";

export {
  countArchivedProjects,
  listArchivable,
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
export { projectLimitMessage } from "./server/limits";
// For the changes and portal modules (repository level, workspace given).
export {
  claimActiveProject,
  countActiveProjects,
  nextChangeNumber,
  setChangeTotals,
  setPaymentTotals,
} from "./server/repository";
export {
  applyDecision,
  findByPortalTokenHash,
  type PortalProject,
} from "./server/portal-repository";
export { type SentProposal } from "./server/project-docs";
// For the daily reminder run (no signed-in member; workspace given).
export {
  findReminderTarget,
  type ReminderTarget,
} from "./server/reminder-target";
export { PORTAL_TOKEN_PATTERN } from "./server/portal";
export {
  documentBusiness,
  getProposalDocument,
  projectReference,
  toProposalDocument,
} from "./server/document";
