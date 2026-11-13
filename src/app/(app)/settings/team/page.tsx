import type { Metadata } from "next";
import { Suspense } from "react";
import { TeamSettings } from "@/modules/team";
import { getTeamPage } from "@/modules/team/server";
import { ListSkeleton } from "@/shared/ui/list-states";

export const metadata: Metadata = { title: "Team" };

export default function TeamSettingsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <Team />
    </Suspense>
  );
}

async function Team() {
  return <TeamSettings team={await getTeamPage()} />;
}
