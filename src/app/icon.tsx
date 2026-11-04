import { ImageResponse } from "next/og";
import { OgMark } from "@/shared/ui/brand/og-mark";

/** Favicon + PWA icons, served at /icon/32, /icon/192, /icon/512, /icon/maskable. */
const icons = {
  "32": { size: 32, glyphScale: 0.84, rounded: true },
  "192": { size: 192, glyphScale: 0.68, rounded: true },
  "512": { size: 512, glyphScale: 0.68, rounded: true },
  // Maskable: full-bleed background, mark inside the 80% safe zone.
  maskable: { size: 512, glyphScale: 0.56, rounded: false },
} as const;

type IconId = keyof typeof icons;

export function generateImageMetadata() {
  return (Object.keys(icons) as IconId[]).map((id) => ({
    id,
    contentType: "image/png",
    size: { width: icons[id].size, height: icons[id].size },
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const icon = icons[String(await id) as IconId] ?? icons["192"];
  return new ImageResponse(
    <OgMark
      size={icon.size}
      glyphScale={icon.glyphScale}
      rounded={icon.rounded}
    />,
    { width: icon.size, height: icon.size },
  );
}
