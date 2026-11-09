/**
 * Overview module: server-only API.
 */
import "server-only";

export {
  getClientMoney,
  getDueByClient,
  getOverview,
  type OverviewData,
} from "./server/queries";
