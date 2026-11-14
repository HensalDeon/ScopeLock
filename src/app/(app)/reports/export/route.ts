import { connection } from "next/server";
import { parseFinancialYear } from "@/modules/reports";
import { getRecoveredCsv } from "@/modules/reports/server";

/**
 * GET /reports/export?year=2026: the revenue recovered CSV for one
 * financial year (Agency). Signed-in members of the workspace only.
 */
export async function GET(request: Request) {
  await connection();
  const year = parseFinancialYear(
    new URL(request.url).searchParams.get("year"),
  );
  const csv = await getRecoveredCsv(year);
  // Not on Agency: the reports page says what it is and where to get it.
  if (!csv) return Response.redirect(new URL("/reports", request.url), 303);
  return new Response(csv.body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csv.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
