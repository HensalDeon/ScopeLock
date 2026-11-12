"use client";

import {
  ChartColumn,
  FolderKanban,
  LayoutGrid,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { LinkPending } from "@/shared/ui/link-pending";

type NavItem = {
  href: "/dashboard" | "/projects" | "/clients" | "/reports" | "/settings";
  label: string;
  icon: LucideIcon;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/reports", label: "Reports", icon: ChartColumn },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="grid gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors max-lg:h-11",
              active
                ? "bg-sidebar-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
            )}
          >
            <Icon
              className={cn("size-4", active && "text-brand")}
              aria-hidden
            />
            <span className="flex-1">{label}</span>
            <LinkPending />
          </Link>
        );
      })}
    </nav>
  );
}
