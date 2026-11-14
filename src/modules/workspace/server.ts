/**
 * Workspace module: server-only API for pages, layouts and other modules'
 * server code. Never import this from a client component.
 */
import "server-only";

export { workspaceAction } from "./server/action";
export {
  getOnboardingState,
  requireWorkspace,
  requireWorkspaceForWrite,
  type WorkspaceContext,
} from "./server/context";
// For jobs that run without a signed-in member (workspace given).
export { getWorkspaceProfile } from "./server/repository";
