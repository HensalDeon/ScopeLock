/**
 * Admin module: public, client-safe API.
 */
export { isAdmin, isListedAdmin, parseAdminEmails } from "./domain/admins";
export { ChangeLog, type ChangeLogEntry } from "./ui/change-log";
export { AdminNav } from "./ui/admin-nav";
export { WorkspaceList, type WorkspaceRow } from "./ui/workspace-list";
