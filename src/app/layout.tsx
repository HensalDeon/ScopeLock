import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { site } from "@/shared/config/site";
import { splashStartupImages } from "@/shared/config/splash";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_IN",
    title: `${site.name}: get paid for the extra work clients ask for`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name}: get paid for the extra work clients ask for`,
    description: site.description,
  },
  appleWebApp: {
    capable: true,
    title: site.name,
    statusBarStyle: "default",
    // The installed app's start-up screen on iPhone (else it's blank white).
    startupImage: splashStartupImages(),
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: site.colors.background },
    { media: "(prefers-color-scheme: dark)", color: site.colors.ink },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
