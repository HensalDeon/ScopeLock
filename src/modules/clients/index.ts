/**
 * Clients module: public, client-safe API.
 * Server-only queries are in ./server.ts.
 */
export {
  clientContactLine,
  clientFirstName,
  clientFormValues,
  clientInputSchema,
  clientLabel,
  type Client,
} from "./domain/client";
export { quickAddClient } from "./server/actions";
export { ArchiveClientButton } from "./ui/archive-client-button";
export { ClientDetails } from "./ui/client-details";
export { ClientForm } from "./ui/client-form";
export { ClientSummary } from "./ui/client-summary";
export { ClientList } from "./ui/client-list";
