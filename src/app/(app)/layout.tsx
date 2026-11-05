import { Suspense } from "react";
import { Shell, ShellSkeleton } from "./_shell/shell";
import { VerifyEmailBanner } from "./_shell/verify-email-banner";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Suspense fallback={<ShellSkeleton />}>
        <Shell />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={null}>
          <VerifyEmailBanner />
        </Suspense>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
