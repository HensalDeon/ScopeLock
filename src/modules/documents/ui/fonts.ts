import { Cormorant_Garamond } from "next/font/google";

/**
 * Serif for document headings (as in the Estimator proposal). Self-hosted by
 * next/font at build time, so no request to Google from the client's browser
 * and nothing to add to the CSP.
 */
export const documentSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-doc-serif",
  display: "swap",
});
