/**
 * Projects module: public, client-safe API (scope, billing, project UI).
 * Server-only queries are in ./server.ts.
 */
export {
  isEditable,
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectDecision,
  type ProjectStatus,
} from "./domain/project";
export { EMPTY_PROPOSAL, type ProposalContent } from "./domain/proposal";
export { DeleteProjectButton } from "./ui/delete-project-button";
export {
  indiaDatePlusDays,
  proposalFormDefaults,
} from "./ui/proposal-form-defaults";
export {
  MilestoneTable,
  ScopeTable,
  type ScheduleAdditions,
} from "./ui/project-plan";
export {
  ProjectForm,
  type ClientOption,
  type ProjectFormDefaults,
} from "./ui/project-form";
export { ProjectList } from "./ui/project-list";
export { ProjectStatusBadge } from "./ui/project-status-badge";
export { SharePanel } from "./ui/share-panel";
