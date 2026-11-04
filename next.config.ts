import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server build: runs on Vercel today and on any Node host
  // (Hostinger VPS / Node.js hosting) later with `node .next/standalone/server.js`.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
