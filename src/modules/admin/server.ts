/**
 * Admin module: server-only API. Platform admins (ADMIN_EMAILS), their
 * strict form actions, and the insert-only audit log.
 */
import "server-only";

export {
  requireAdmin,
  isCurrentUserAdmin,
  canSeeAdmin,
  getAdminAccess,
  type AdminAccess,
  type AdminContext,
} from "./server/access";
export { adminAction } from "./server/action";
export {
  listAdminChanges,
  logAdminChange,
  type AuditEntry,
} from "./server/audit";
