import { connection } from "next/server";
import { runAutoReminders } from "@/modules/reminders/server";
import { env } from "@/shared/lib/env";
import { hashToken, tokenMatchesHash } from "@/shared/lib/token";

/**
 * GET /api/cron/reminders: the daily run of automatic payment reminders.
 * A scheduler calls it once a day, in Indian working hours, with
 * "Authorization: Bearer <CRON_SECRET>" (Vercel Cron sends it by itself;
 * on a plain server, a crontab line with curl). Safe to call again: no
 * reminder goes twice.
 */
export async function GET(request: Request) {
  await connection();
  const secret = env().CRON_SECRET;
  if (!secret) return new Response("Not found", { status: 404 });
  const given = /^Bearer (.+)$/.exec(
    request.headers.get("authorization") ?? "",
  )?.[1];
  if (!given || !tokenMatchesHash(given, hashToken(secret)))
    return new Response("Unauthorized", { status: 401 });
  const run = await runAutoReminders();
  return Response.json(run);
}
