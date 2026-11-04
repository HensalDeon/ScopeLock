import { ImageResponse } from "next/og";
import { OgMark } from "@/shared/ui/brand/og-mark";

/** iOS home-screen icon. iOS applies its own rounded mask, so no rounding here. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <OgMark size={180} glyphScale={0.62} rounded={false} />,
    size,
  );
}
