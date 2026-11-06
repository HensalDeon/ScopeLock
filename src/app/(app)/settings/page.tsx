import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountNameForm, SignOutButton } from "@/modules/account";
import { BusinessDetailsForm } from "@/modules/workspace";
import { formatPhone } from "@/shared/lib/phone";
import { requireWorkspace } from "@/modules/workspace/server";
import { Badge } from "@/shared/ui/badge";
import { Section } from "@/shared/ui/page";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="max-w-4xl">
      <Suspense fallback={<div className="h-96 rounded-xl bg-canvas" />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

async function SettingsContent() {
  const { user, workspace } = await requireWorkspace();

  return (
    <div>
      <Section
        title="Business details"
        description="Clients see these on approval pages, change orders and PDFs."
      >
        <BusinessDetailsForm
          initial={{
            businessName: workspace.businessName,
            businessType: workspace.businessType,
            phone: workspace.phone ? formatPhone(workspace.phone) : "",
            currency: workspace.currency,
          }}
        />
      </Section>

      <Section title="Your account" description="Only you see this.">
        <div className="grid gap-8">
          <AccountNameForm name={user.name} />
          <div className="grid gap-1.5">
            <p className="text-sm font-medium">Email</p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm">{user.email}</p>
              {user.emailVerified ? (
                <Badge variant="secondary">Confirmed</Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-warning/30 text-warning"
                >
                  Not confirmed
                </Badge>
              )}
            </div>
          </div>
          <div>
            <SignOutButton variant="outline" size="default" />
          </div>
        </div>
      </Section>
    </div>
  );
}
