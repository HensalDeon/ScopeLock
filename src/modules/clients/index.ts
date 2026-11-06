/**
 * Clients module: public, client-safe API.
 * Server-only queries are in ./server.ts.
 */
export {
  clientFirstName,
  clientInputSchema,
  clientLabel,
  type Client,
} from "./domain/client";
export { quickAddClient } from "./server/actions";
export { ArchiveClientButton } from "./ui/archive-client-button";
export { ClientForm } from "./ui/client-form";
export { ClientList } from "./ui/client-list";
