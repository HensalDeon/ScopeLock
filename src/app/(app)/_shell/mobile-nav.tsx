"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
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
  const [open, setOpen] = useState(false);
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
          <div className="flex h-full flex-col gap-5 p-3 pt-4">
            <div className="px-1.5">
              <Logo className="text-base" />
            </div>
            {workspace}
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-auto">{footer}</div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
