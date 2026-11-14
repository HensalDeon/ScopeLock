import { ImageResponse } from "next/og";
import { site } from "@/shared/config/site";
import { isSplashSize } from "@/shared/config/splash";
import { OgMark } from "@/shared/ui/brand/og-mark";

/**
 * GET /splash?w=1170&h=2532: the installed app's start-up screen on iPhone,
 * shown while ScopeLock opens: the app tile and name on white.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const w = Number(params.get("w"));
  const h = Number(params.get("h"));
  if (!isSplashSize(w, h)) return new Response("Not found", { status: 404 });
  const tile = Math.round(w * 0.22);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: site.colors.background,
        gap: Math.round(tile * 0.28),
      }}
    >
      <div style={{ width: tile, height: tile, display: "flex" }}>
        <OgMark size={tile} />
      </div>
      <div
        style={{
          fontSize: Math.round(tile * 0.26),
          fontWeight: 600,
          color: site.colors.ink,
          letterSpacing: "-0.02em",
        }}
      >
        {site.name}
      </div>
    </div>,
    {
      width: w,
      height: h,
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}
