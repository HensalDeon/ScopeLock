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
      <SmoothScroll />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
