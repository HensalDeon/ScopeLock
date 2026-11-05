import Link from "next/link";
import { BUSINESS_TYPE_LABELS, BusinessInitials } from "@/modules/workspace";
import { requireWorkspace } from "@/modules/workspace/server";
import { initialsOf } from "@/shared/lib/initials";
import { Logo } from "@/shared/ui/brand";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav";
import { UserMenu } from "./user-menu";

/** Sidebar on desktop, top bar + drawer on mobile. Reads the session. */
export async function Shell() {
  const { user, workspace } = await requireWorkspace();

  const workspaceBlock = (
    <div className="flex items-center gap-2.5 rounded-lg border bg-background p-2">
      <BusinessInitials name={workspace.businessName} className="size-8" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{workspace.businessName}</p>
        <p className="text-xs text-muted-foreground">
          {BUSINESS_TYPE_LABELS[workspace.businessType].title}
        </p>
      </div>
    </div>
  );

  const userMenu = (
    <UserMenu
      name={user.name}
      email={user.email}
      initials={initialsOf(user.name)}
    />
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-5 border-r bg-sidebar p-3 pt-4 lg:flex">
        <Link
          href="/dashboard"
          className="w-fit rounded-md px-1.5"
          aria-label="Overview"
        >
          <Logo className="text-base" />
        </Link>
        {workspaceBlock}
        <NavLinks />
        <div className="mt-auto">{userMenu}</div>
      </aside>
      <MobileNav workspace={workspaceBlock} footer={userMenu} />
    </>
  );
}

export function ShellSkeleton() {
  return (
    <>
      <aside
        aria-hidden
        className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-5 border-r bg-sidebar p-3 pt-4 lg:flex"
      >
        <div className="px-1.5">
          <Logo className="text-base" />
        </div>
        <div className="h-[50px] rounded-lg border bg-background" />
        <div className="grid gap-1.5">
          <div className="h-8 rounded-md bg-sidebar-accent/70" />
          <div className="h-8 rounded-md bg-sidebar-accent/40" />
        </div>
      </aside>
      <header
        aria-hidden
        className="flex h-14 items-center border-b px-4 lg:hidden"
      >
        <Logo className="text-base" />
      </header>
    </>
  );
}
