import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanUsage, projectUsage } from "@/modules/billing";
import { getPlans, getWorkspacePlan } from "@/modules/billing/server";
import { countActiveProjects } from "@/modules/projects/server";
import { requireWorkspace } from "@/modules/workspace/server";

export const metadata: Metadata = { title: "Plan & usage" };

export default function PlanSettingsPage() {
  return (
    <div className="max-w-4xl">
      <Suspense fallback={<div className="h-160 rounded-xl bg-canvas" />}>
        <PlanSettings />
      </Suspense>
    </div>
  );
}

async function PlanSettings() {
  const { workspace } = await requireWorkspace();
  const id = workspace.workspaceId;
  const [{ plan, subscription }, plans, active] = await Promise.all([
    getWorkspacePlan(id),
    getPlans(),
    countActiveProjects(id),
  ]);
  return (
    <PlanUsage
      plan={plan}
      plans={plans}
      subscription={subscription}
      projects={projectUsage(plan, active)}
    />
  );
}
