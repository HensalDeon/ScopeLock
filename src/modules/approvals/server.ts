/**
 * Approvals module: server-only API. Signed, insert-only evidence of what a
 * client approved or asked to change.
 */
import "server-only";

export { recordDecision } from "./server/record";
export {
  getApprovalWithSnapshot,
  listApprovalsForProject,
  type CheckedApproval,
} from "./server/queries";
