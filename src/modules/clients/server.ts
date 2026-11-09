/**
 * Clients module: server-only API for pages and other modules' server code.
 */
import "server-only";

export {
  countClients,
  findClient,
  getClientOrNotFound,
  getClientsById,
  countArchivedClients,
  listClients,
  listClientsPage,
  searchClientIds,
} from "./server/queries";
// For server code that already has the workspace (e.g. the client portal,
// where it comes from the link): one client, scoped to that workspace.
export { findClient as findClientInWorkspace } from "./server/repository";
