import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

/**
 * "← Projects" above a page title: the way back up from any inner page
 * (detail, new, edit). Phones and the installed app have no reliable
 * browser Back button, so every inner page gets one.
 */
export function BackLink({
  href,
  children,
  className,
}: {
  href: Route;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground max-sm:min-h-11",
        className,
      )}
    >
      <ArrowLeft aria-hidden className="size-3.5" />
      {children}
    </Link>
  );
}
