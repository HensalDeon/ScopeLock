/**
 * Projects module: public, client-safe API (scope, billing, project UI).
 * Server-only queries are in ./server.ts.
 */
export {
  isEditable,
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectStatus,
} from "./domain/project";
export { DeleteProjectButton } from "./ui/delete-project-button";
export { MilestoneTable, ScopeTable } from "./ui/project-plan";
export {
  ProjectForm,
  type ClientOption,
  type ProjectFormDefaults,
} from "./ui/project-form";
export { ProjectList } from "./ui/project-list";
export { ProjectStatusBadge } from "./ui/project-status-badge";
