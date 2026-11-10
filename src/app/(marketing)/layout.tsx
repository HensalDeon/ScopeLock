import { Anek_Latin } from "next/font/google";
import { SiteFooter, SiteHeader, SmoothScroll } from "@/modules/marketing";

// Marketing headlines only (DESIGN.md: marketing-display). By Ek Type,
// Mumbai; the width axis lets headlines run semi-condensed.
const display = Anek_Latin({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-anek",
  display: "swap",
});

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={`sl-site ${display.variable} flex min-h-dvh flex-col`}>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-background text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:px-3 focus:py-2 focus:ring-3 focus:ring-ring/50"
      >
        Skip to content
      </a>
      <SmoothScroll />
      <SiteHeader />
      <main
        id="main"
        tabIndex={-1}
        className="flex-1 scroll-mt-16 outline-none"
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
