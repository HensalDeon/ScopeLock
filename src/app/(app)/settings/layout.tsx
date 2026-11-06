import { PageContainer, PageHeader } from "@/shared/ui/page";
import { SettingsTabs } from "./_components/settings-tabs";

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <PageContainer className="max-w-6xl">
      <PageHeader title="Settings" />
      <SettingsTabs />
      {children}
    </PageContainer>
  );
}
