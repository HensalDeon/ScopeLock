import { Suspense } from "react";
import { requireWorkspace } from "@/modules/workspace/server";
import { PageContainer, PageHeader } from "@/shared/ui/page";
import { SettingsTabs } from "./_components/settings-tabs";

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <PageContainer>
      <PageHeader title="Settings" />
      <SettingsTabs />
      <Suspense>
        <MemberNote />
      </Suspense>
      {children}
    </PageContainer>
  );
}

/** A member sees the settings but can't change them: say so up front. */
async function MemberNote() {
  const { role } = await requireWorkspace();
  if (role !== "member") return null;
  return (
    <p className="mb-6 max-w-prose rounded-lg border bg-canvas px-4 py-3 text-sm text-pretty">
      You&apos;re a member of this workspace: you can see its settings, but only
      the owner or an admin can change them.
    </p>
  );
}
