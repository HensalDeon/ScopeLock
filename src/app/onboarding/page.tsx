import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignOutButton } from "@/modules/account";
import { getWorkspaceProfile, OnboardingForm } from "@/modules/workspace";
import { findDefaultWorkspaceId } from "@/shared/auth/membership";
import { requireSession } from "@/shared/auth/session";
import { Logo } from "@/shared/ui/brand";

export const metadata: Metadata = { title: "Set up your workspace" };

export default function OnboardingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="flex h-16 items-center justify-between border-b px-5 sm:px-8">
        <Logo className="text-base" />
        <SignOutButton />
      </header>
      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-10 grid max-w-xl gap-2">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance sm:text-[28px]">
            Set up your workspace
          </h1>
          <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
            This is how your business appears to clients on approval links,
            change orders and PDFs. You can change it later in Settings.
          </p>
        </div>
        <Suspense fallback={<div className="h-96 rounded-xl bg-canvas" />}>
          <Onboarding />
        </Suspense>
      </main>
    </div>
  );
}

async function Onboarding() {
  const { user } = await requireSession();
  const workspaceId = await findDefaultWorkspaceId(user.id);
  if (workspaceId && (await getWorkspaceProfile(workspaceId))) {
    redirect("/dashboard");
  }
  return <OnboardingForm suggestedName={user.name} />;
}
