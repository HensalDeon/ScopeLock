import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignOutButton, VerifyEmailForm } from "@/modules/account";
import { AdminNav } from "@/modules/admin";
import { getAdminAccess } from "@/modules/admin/server";
import { Logo } from "@/shared/ui/brand";
import { PageLoader } from "@/shared/ui/brand/brand-loader";

// Titles are set inside each page, after the admin check, so nothing in
// the prerendered page says what this area is.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Platform admin pages (ADMIN_EMAILS only). Anyone else gets not found, so
 * the frame below isn't shown either. A listed email that isn't confirmed
 * yet is asked for its code first. Each page and action checks again.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminFrame>{children}</AdminFrame>
    </Suspense>
  );
}

const LINK =
  "font-medium underline underline-offset-4 max-sm:inline-flex max-sm:min-h-11 max-sm:items-center";

async function AdminFrame({ children }: { children: React.ReactNode }) {
  const access = await getAdminAccess();
  const signedInAs =
    access.kind === "admin" ? access.admin.email : access.email;
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Logo className="text-lg" />
            <span className="border-l pl-3 text-sm font-medium">Admin</span>
            {access.kind === "admin" && <AdminNav />}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="truncate text-muted-foreground max-sm:hidden">
              {signedInAs}
            </span>
            {access.kind === "admin" && access.hasWorkspace && (
              <Link href="/dashboard" className={LINK}>
                Back to your workspace
              </Link>
            )}
            <SignOutButton className="max-sm:h-11" />
          </div>
        </div>
      </header>
      <main id="content" className="flex-1">
        {access.kind === "admin" ? (
          children
        ) : (
          <div className="mx-auto grid w-full max-w-md gap-4 px-4 py-16">
            <title>Confirm your email · ScopeLock admin</title>
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">
              Confirm your email
            </h1>
            <p className="text-[15px] text-pretty text-muted-foreground">
              The admin pages open once this email is confirmed. Enter the
              6-digit code we sent to{" "}
              <strong className="font-medium text-foreground">
                {access.email}
              </strong>
              .
            </p>
            <VerifyEmailForm email={access.email} />
          </div>
        )}
      </main>
    </div>
  );
}
