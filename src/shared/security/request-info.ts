import "server-only";
import { headers } from "next/headers";
import { env } from "@/shared/lib/env";

/**
 * Who is making this request, for rate limits and evidence: the IP from the
 * header the host sets (CLIENT_IP_HEADER, never a client-chosen one) and the
 * browser's user agent. Values are trimmed and length-capped.
 */
export async function requestInfo(): Promise<{
  ip: string | null;
  userAgent: string | null;
}> {
  const h = await headers();
  const raw = h.get(env().CLIENT_IP_HEADER) ?? "";
  // x-forwarded-for may list proxies: the first entry is the client.
  const ip = raw.split(",")[0]?.trim() ?? "";
  return {
    ip: /^[0-9a-fA-F:.]{2,45}$/.test(ip) ? ip : null,
    userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
  };
}
