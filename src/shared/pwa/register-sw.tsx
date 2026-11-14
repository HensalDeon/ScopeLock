"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) in production builds: it shows
 * the offline page when a page can't load, and makes the app installable.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Not fatal: the app works the same, just without the offline page.
      });
  }, []);
  return null;
}
