import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/modules/admin";
import { requireAdmin } from "@/modules/admin/server";
import { Logo } from "@/shared/ui/brand";
import { PageLoader } from "@/shared/ui/brand/brand-loader";

// Titles are set inside each page, after the admin check, so nothing in
// the prerendered page says what this area is.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Platform admin pages (ADMIN_EMAILS only). Anyone else gets not found, so
 * the frame below isn't shown either. Each page and action checks again.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminFrame>{children}</AdminFrame>
    </Suspense>
  );
}

async function AdminFrame({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link href="/dashboard" className="max-sm:py-2.5">
              <Logo className="text-lg" />
            </Link>
            <span className="border-l pl-3 text-sm font-medium">Admin</span>
            <AdminNav />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="truncate text-muted-foreground max-sm:hidden">
              {admin.email}
            </span>
            <Link
              href="/dashboard"
              className="font-medium underline underline-offset-4 max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
            >
              Back to your workspace
            </Link>
          </div>
        </div>
      </header>
      <main id="content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
