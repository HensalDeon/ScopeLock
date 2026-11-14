import { offlineHtml } from "@/shared/pwa/offline-page";

/**
 * The offline page, as one document. The service worker saves it when it
 * installs and shows it when a page can't load (public/sw.js).
 */
export function GET() {
  return new Response(offlineHtml(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Robots-Tag": "noindex",
    },
  });
}
