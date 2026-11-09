import type { Metadata } from "next";
import { Suspense } from "react";
import { Shell, ShellSkeleton } from "./_shell/shell";
import { VerifyEmailBanner } from "./_shell/verify-email-banner";

/** Signed-in pages never belong in search results. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* First thing a keyboard reaches: jump past the sidebar. */}
      <a
        href="#content"
        className="sr-only z-50 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Suspense fallback={<ShellSkeleton />}>
        <Shell />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={null}>
          <VerifyEmailBanner />
        </Suspense>
        <main id="content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
