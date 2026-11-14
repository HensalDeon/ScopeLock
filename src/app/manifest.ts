import type { MetadataRoute } from "next";
import { site } from "@/shared/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: site.name,
    short_name: site.name,
    description: site.description,
    // Open straight into the app (signed-out people are sent to sign in).
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: site.colors.background,
    theme_color: site.colors.ink,
    categories: ["business", "productivity", "finance"],
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon/maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
