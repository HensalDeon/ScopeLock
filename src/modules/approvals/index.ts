/**
 * Approvals module: public, client-safe API.
 */
export {
  DECISION_FIELDS,
  DECISION_LIMITS,
  decisionInputSchema,
  type Approval,
  type ApprovalSubject,
  type Decision,
  type DecisionField,
  type DecisionInput,
  verdictLabel,
} from "./domain/approval";
export { ApprovalHistory } from "./ui/approval-history";
