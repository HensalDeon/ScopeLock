"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/utils";

// In the order a new freelancer sets things up: who you are, how you get
// paid, how invoices are taxed, then how documents look.
const TABS = [
  { href: "/settings", label: "Business & account" },
  { href: "/settings/payments", label: "Payments" },
  { href: "/settings/invoicing", label: "Invoices & GST" },
  { href: "/settings/documents", label: "Documents" },
] as const;

export function SettingsTabs() {
  const pathname = usePathname();
  const nav = useRef<HTMLElement>(null);
  // Narrow tablets: the strip can scroll sideways; keep the current tab in view.
  useEffect(() => {
    nav.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);
  return (
    <nav
      ref={nav}
      aria-label="Settings"
      // Phones: all four in a 2×2 grid (a sideways strip hid "Documents").
      className="mb-8 grid grid-cols-2 border-b sm:flex sm:gap-1 sm:overflow-x-auto"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 pb-2.5 text-sm whitespace-nowrap transition-colors max-sm:flex max-sm:h-11 max-sm:items-center max-sm:pb-0 max-sm:pl-1",
              active
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
