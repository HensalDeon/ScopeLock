"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/shared/ui/brand";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { NavLinks } from "./nav";

export function MobileNav({
  workspace,
  footer,
}: {
  workspace: React.ReactNode;
  footer: React.ReactNode;
}) {
  // Open only on the page it was opened on: any navigation from inside it
  // (nav links, Settings in the account menu, switching workspace) closes it.
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:hidden print:hidden">
      <Link
        href="/dashboard"
        aria-label="Overview"
        className="inline-flex min-h-11 items-center"
      >
        <Logo className="text-base" />
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Open menu"
          >
            <Menu className="size-5" aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 gap-0 bg-sidebar p-0 sm:max-w-72"
        >
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate ScopeLock
          </SheetDescription>
          {/* A link to the page you're already on doesn't change the path:
              close on the click itself too. Menus inside (the account menu)
              render in a portal but still bubble here through React. */}
          <div
            className="flex h-full flex-col gap-5 p-3 pt-4"
            onClickCapture={(event) => {
              // A link to another page: stay open, showing it loading, until
              // the page changes (which closes the sheet). A link to this
              // page changes nothing, so close now.
              const link = (event.target as Element).closest("a[href]");
              if (
                link instanceof HTMLAnchorElement &&
                new URL(link.href).pathname === pathname
              )
                setOpen(false);
            }}
          >
            <div className="px-1.5">
              <Logo className="text-base" />
            </div>
            {workspace}
            <NavLinks />
            <div className="mt-auto">{footer}</div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
