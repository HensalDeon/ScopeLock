/**
 * Projects module: server-only API for pages and other modules' server code.
 */
import "server-only";

export {
  countProjects,
  getProjectOrNotFound,
  listProjects,
  listProjectsForClient,
  type ProjectWithClient,
} from "./server/queries";
