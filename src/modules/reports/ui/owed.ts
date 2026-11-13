import type { CurrencyCode } from "@/shared/lib/currency";
import { formatMoney } from "@/shared/lib/money";
import type { ReportTotals } from "../domain/recovered-report";

/**
 * What's still to come, split the way the project page splits it: asked
 * for (a payment request is out) and not asked for yet.
 */
export function owedText(line: ReportTotals, currency: CurrencyCode): string {
  const money = (n: ReportTotals["asked"]) => formatMoney(n, currency);
  if (line.outstanding === 0) return "nothing left to receive";
  const total = `${money(line.outstanding)} still to receive`;
  if (line.asked > 0 && line.notAsked > 0)
    return `${total}, ${money(line.asked)} of it asked for`;
  return `${total}, ${line.asked > 0 ? "asked for" : "not asked for yet"}`;
}
