/**
 * Clients module: server-only API for pages and other modules' server code.
 */
import "server-only";

export {
  countClients,
  findClient,
  getClientOrNotFound,
  getClientsById,
  listClients,
} from "./server/queries";
