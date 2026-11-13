import Link from "next/link";
import { Logo } from "@/shared/ui/brand";

/**
 * Joining a team, or a team you can't open right now: the ScopeLock mark
 * and one column, without the sign-up page's sales panel.
 */
export default function JoinLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas px-5 py-6 sm:px-10 sm:py-8">
      <Link
        href="/"
        className="w-fit rounded-md max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
        aria-label="ScopeLock home"
      >
        <Logo className="text-lg" />
      </Link>
      <main className="flex flex-1 items-center py-12">
        <div className="mx-auto w-full max-w-md rounded-xl border bg-background p-6 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
