import type { MetadataRoute } from "next";
import { site } from "@/shared/config/site";

/** Bump when a public page changes meaningfully. */
const UPDATED = new Date("2026-11-04");

const PAGES: {
  path: string;
  priority: number;
  freq: "weekly" | "monthly" | "yearly";
}[] = [
  { path: "/", priority: 1, freq: "weekly" },
  { path: "/pricing", priority: 0.9, freq: "monthly" },
  { path: "/sign-up", priority: 0.6, freq: "yearly" },
  { path: "/contact", priority: 0.4, freq: "yearly" },
  { path: "/terms", priority: 0.2, freq: "yearly" },
  { path: "/privacy", priority: 0.2, freq: "yearly" },
  { path: "/refunds", priority: 0.2, freq: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((page) => ({
    url: new URL(page.path, site.url).toString(),
    lastModified: UPDATED,
    changeFrequency: page.freq,
    priority: page.priority,
  }));
}
