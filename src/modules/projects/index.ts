/**
 * Projects module: public, client-safe API (scope, billing, project UI).
 * Server-only queries are in ./server.ts.
 */
export {
  isEditable,
  isScopeApproved,
  proposalShareMessage,
  shareMessage,
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectDecision,
  type ProjectStatus,
} from "./domain/project";
export { unlockingSteps } from "./domain/payment-timing";
export { EMPTY_PROPOSAL, type ProposalContent } from "./domain/proposal";
export { DeleteProjectButton } from "./ui/delete-project-button";
export {
  clientOptions,
  newProjectValues,
  projectFormValues,
} from "./ui/project-form-values";
export {
  MilestoneTable,
  ScopeTable,
  type ScheduleAdditions,
  type ScopeChanges,
} from "./ui/project-plan";
export {
  ProjectForm,
  type ClientOption,
  type ProjectFormDefaults,
} from "./ui/project-form";
export { ProjectHeader } from "./ui/project-header";
export { ProjectList } from "./ui/project-list";
export { ProjectSidebar } from "./ui/project-sidebar";
export { ProjectSkeleton } from "./ui/project-skeleton";
export { ProjectStatusBadge } from "./ui/project-status-badge";
export { SharePanel } from "./ui/share-panel";
