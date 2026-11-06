import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OverviewSkeleton, OverviewView } from "@/modules/overview";
import { getOverview } from "@/modules/overview/server";
import { Button } from "@/shared/ui/button";
import { PageContainer, PageHeader } from "@/shared/ui/page";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Overview"
        actions={
          <Button asChild>
            <Link href="/projects/new">
              <Plus aria-hidden />
              New project
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<OverviewSkeleton />}>
        <Overview />
      </Suspense>
    </PageContainer>
  );
}

async function Overview() {
  return <OverviewView data={await getOverview()} />;
}
