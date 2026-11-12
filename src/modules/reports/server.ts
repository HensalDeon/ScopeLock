/**
 * Reports module: server-only API. Revenue recovered by month and client,
 * and its CSV (Agency).
 */
import "server-only";

export {
  getRecoveredCsv,
  getRecoveredReport,
  type RecoveredReportPage,
} from "./server/queries";
