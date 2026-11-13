/**
 * Team module: server-only API. Members, roles and invitations (Agency),
 * and whether a member has a place on the plan.
 */
import "server-only";

export { memberHasSeat } from "./server/access";
export {
  getInvitePage,
  getPausedAccess,
  getTeamPage,
  listMyWorkspaces,
  type InvitePage,
  type PausedAccess,
  type TeamPage,
} from "./server/queries";
export {
  acceptInvite,
  leaveWorkspace,
  switchWorkspace,
} from "./server/session-actions";
