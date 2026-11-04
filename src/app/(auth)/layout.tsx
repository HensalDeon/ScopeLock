import Link from "next/link";
import { LedgerShowcase } from "@/modules/account";
import { Logo } from "@/shared/ui/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10 sm:py-8">
        <Link href="/" className="w-fit rounded-md" aria-label="ScopeLock home">
          <Logo className="text-lg" />
        </Link>
        <main className="flex flex-1 items-center py-12">
          <div className="mx-auto w-full max-w-[23rem]">{children}</div>
        </main>
      </div>
      <LedgerShowcase />
    </div>
  );
}
