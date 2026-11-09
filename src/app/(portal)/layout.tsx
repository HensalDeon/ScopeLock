import type { Metadata } from "next";

/**
 * Client portal: public pages opened from a secret link. No app shell and
 * no sign-in. next.config.ts adds no-referrer, noindex and no-store for /c/*.
 */
export const metadata: Metadata = {
  // An object, so the pages below keep the "· ScopeLock" suffix.
  title: { default: "Proposal · ScopeLock", template: "%s · ScopeLock" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function PortalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh bg-[#ebe8e2] print:bg-white">{children}</div>
  );
}
