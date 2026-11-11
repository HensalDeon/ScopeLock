import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy.
 *
 * Static ('self'-based) rather than nonce-based on purpose: a nonce forces
 * every page to render per request, which turns off the static shells that
 * Cache Components / partial prerendering give us (see Next's CSP guide).
 * 'unsafe-inline' scripts are needed for Next's inline bootstrap without a
 * nonce. The directives that matter most here are frame-ancestors (no
 * clickjacking of approval buttons), object-src, base-uri, form-action and
 * connect-src (data can only go back to our own origin).
 *
 * When adding a third party (R2 images, Razorpay checkout), add its origin to
 * the narrowest directive that needs it.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // Razorpay Checkout (paying for ScopeLock's own plans) loads its script
  // and opens its payment window in a frame.
  `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://cdn.razorpay.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Signed URLs from the private R2 bucket (logo, cover image).
  "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://cdn.razorpay.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "font-src 'self'",
  `connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com${isDev ? " ws:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  // No upgrade-insecure-requests: every asset is same-origin and HSTS already
  // forces https in production; the directive breaks `next start` on localhost.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Older browsers that ignore frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      // payment: only Razorpay's checkout frame (paying for ScopeLock plans).
      'camera=(), microphone=(), geolocation=(), payment=(self "https://api.razorpay.com"), usb=(), interest-cohort=()',
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HSTS only in production; a plain Node host won't add it for us.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]),
];

const nextConfig: NextConfig = {
  // Self-contained server build: runs on Vercel today and on any Node host
  // (Hostinger VPS / Node.js hosting) later with `node .next/standalone/server.js`.
  output: "standalone",
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  experimental: {
    serverActions: {
      // Image uploads (resized in the browser first). Stays under Vercel's
      // 4.5 MB request limit; the server caps files at 4 MB.
      bodySizeLimit: "4.4mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The service worker: always re-checked, so updates reach people.
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
      {
        // Client portal (Phase 3): secret-link pages. Never leak the token in
        // the Referer, never index, never cache in shared caches.
        source: "/c/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
