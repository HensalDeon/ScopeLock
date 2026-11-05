import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { Route } from "next";
import { countClients } from "@/modules/clients/server";
import { listProjects } from "@/modules/projects/server";
import { BUSINESS_TYPE_LABELS } from "@/modules/workspace";
import { requireWorkspace } from "@/modules/workspace/server";
import { formatPhone } from "@/shared/lib/phone";
import { cn } from "@/shared/lib/utils";
import { PageContainer, PageHeader } from "@/shared/ui/page";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader title="Overview" />
      <Suspense fallback={<OverviewSkeleton />}>
        <Overview />
      </Suspense>
    </PageContainer>
  );
}

type Step = { title: string; detail: string; done: boolean; href?: Route };

async function Overview() {
  const [{ user, workspace }, clientCount, projects] = await Promise.all([
    requireWorkspace(),
    countClients(),
    listProjects(),
  ]);
  const sentForApproval = projects.some((p) => p.status !== "draft");

  const steps: Step[] = [
    {
      title: "Set up your workspace",
      detail: `${workspace.businessName} · ${BUSINESS_TYPE_LABELS[workspace.businessType].title}`,
      done: true,
    },
    {
      title: "Add your first client",
      detail: "Their name, company and WhatsApp number.",
      done: clientCount > 0,
      href: "/clients/new",
    },
    {
      title: "Write down a project's scope",
      detail: "List what's included, the price, and how the client pays.",
      done: projects.length > 0,
      href: "/projects/new",
    },
    {
      title: "Get the scope approved",
      detail:
        "Send it to your client. Once they approve, it's locked as the baseline.",
      done: sentForApproval,
    },
    {
      title: "Log extra requests as they come in",
      detail:
        "Each one becomes a priced change request your client approves before you start.",
      done: false,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section
        aria-labelledby="setup-title"
        className="rounded-xl border bg-background"
      >
        <div className="flex items-baseline justify-between gap-4 border-b px-5 py-4">
          <h2 id="setup-title" className="font-semibold">
            Getting set up
          </h2>
          <p className="text-sm text-muted-foreground tabular-nums">
            {doneCount} of {steps.length} done
          </p>
        </div>
        <ol className="divide-y">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4 px-5 py-4">
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums",
                  step.done
                    ? "border-brand bg-brand text-white"
                    : "bg-background text-muted-foreground",
                )}
              >
                {step.done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.done && "text-muted-foreground",
                  )}
                >
                  {step.href && !step.done ? (
                    <Link
                      href={step.href}
                      className="underline-offset-4 hover:underline"
                    >
                      {step.title}
                    </Link>
                  ) : (
                    step.title
                  )}
                  <span className="sr-only">
                    {step.done ? " (done)" : " (to do)"}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <aside
        aria-labelledby="details-title"
        className="rounded-xl border bg-canvas p-5"
      >
        <h2 id="details-title" className="text-sm font-semibold">
          Your business details
        </h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Business name</dt>
            <dd className="font-medium">{workspace.businessName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">WhatsApp</dt>
            <dd className="font-medium tabular-nums">
              {workspace.phone ? formatPhone(workspace.phone) : "Not added"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Account email</dt>
            <dd className="truncate font-medium">{user.email}</dd>
          </div>
        </dl>
        <Link
          href="/settings"
          className="mt-5 inline-block text-sm font-medium underline-offset-4 hover:underline"
        >
          Edit details
        </Link>
      </aside>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div
      aria-hidden
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
    >
      <div className="h-[22rem] rounded-xl border bg-canvas" />
      <div className="h-64 rounded-xl border bg-canvas" />
    </div>
  );
}
