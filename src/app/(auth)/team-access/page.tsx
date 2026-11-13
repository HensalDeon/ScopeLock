import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FormSkeleton } from "@/modules/account";
import { PausedView } from "@/modules/team";
import { getPausedAccess } from "@/modules/team/server";

export const metadata: Metadata = {
  title: "Workspace paused",
  robots: { index: false, follow: false },
};

/** A teammate past the plan's people: why, and where to go instead. */
export default function TeamAccessPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <Paused />
    </Suspense>
  );
}

async function Paused() {
  const access = await getPausedAccess();
  if (!access) redirect("/dashboard");
  return <PausedView access={access} />;
}
