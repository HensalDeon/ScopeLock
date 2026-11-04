import { connection } from "next/server";
import { pingDb } from "@/shared/db/client";

/**
 * GET /api/health — liveness + database connectivity.
 * Returns 200 when MongoDB answers, 503 otherwise. Used by uptime monitors.
 */
export async function GET() {
  await connection(); // always run per request, never prerendered

  try {
    const db = await pingDb();
    return Response.json({
      status: "ok",
      db: { status: "up", latencyMs: db.latencyMs },
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[health] database check failed", error);
    return Response.json(
      {
        status: "degraded",
        db: { status: "down" },
        time: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
