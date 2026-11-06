import { PageContainer, PageHeader } from "@/shared/ui/page";
import { SettingsTabs } from "./_components/settings-tabs";

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <PageContainer>
      <PageHeader title="Settings" />
      <SettingsTabs />
      {children}
    </PageContainer>
  );
}
