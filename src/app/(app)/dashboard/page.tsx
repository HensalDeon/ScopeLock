import { Plus } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActivityTimeline } from "@/modules/activity";
import { listRecentActivity } from "@/modules/activity/server";
import { changeLabel } from "@/modules/changes";
import { listOpenChanges } from "@/modules/changes/server";
import { clientFirstName } from "@/modules/clients";
import { countClients } from "@/modules/clients/server";
import { portfolioTotals } from "@/modules/projects";
import {
  getShareState,
  listProjects,
  type ProjectWithClient,
} from "@/modules/projects/server";
import { BUSINESS_TYPE_LABELS } from "@/modules/workspace";
import { requireWorkspace } from "@/modules/workspace/server";
import { formatAgo } from "@/shared/lib/dates";
import { formatMoney, type Minor } from "@/shared/lib/money";
import { whatsappLink } from "@/shared/lib/phone";
import { Button } from "@/shared/ui/button";
import { PageContainer, PageHeader } from "@/shared/ui/page";
import {
  AttentionList,
  type AttentionItem,
} from "./_components/attention-list";
import { MoneyStrip } from "./_components/money-strip";
import { SetupChecklist, type SetupStep } from "./_components/setup-checklist";

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
  const [{ workspace }, clientCount, projects, openChanges, activity] =
    await Promise.all([
      requireWorkspace(),
      countClients(),
      listProjects(),
      listOpenChanges(),
      listRecentActivity(10),
    ]);
  const byId = new Map(projects.map((p) => [p.id, p]));

  const steps: SetupStep[] = [
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
      done: projects.some(
        (p) => p.status !== "draft" && p.status !== "awaiting_approval",
      ),
    },
    {
      title: "Log extra requests as they come in",
      detail:
        "Each one becomes a priced change request your client approves before you start.",
      done: projects.some((p) => p.changeCount > 0) || openChanges.length > 0,
    },
  ];
  const setupDone = steps.every((s) => s.done);
  const checklist = !setupDone && <SetupChecklist steps={steps} />;

  if (projects.length === 0)
    return <div className="grid gap-8">{checklist}</div>;

  // ── Waiting on clients: oldest first, with a WhatsApp nudge ──
  const money = (amount: Minor, p: ProjectWithClient) =>
    formatMoney(amount, p.currency);
  const who = (p: ProjectWithClient) =>
    p.client ? clientFirstName(p.client) : "your client";
  const sentCrs = openChanges.filter((c) => c.status === "sent");
  const waitingIds = new Set([
    ...projects
      .filter((p) => p.status === "awaiting_approval")
      .map((p) => p.id),
    ...sentCrs.map((c) => c.projectId),
  ]);
  const links = new Map(
    await Promise.all(
      [...waitingIds].map(
        async (id) => [id, (await getShareState(id)).url] as const,
      ),
    ),
  );
  const remind = (p: ProjectWithClient, url: string | null, text: string) => {
    if (!url) return null;
    const message = `${text} ${url}`;
    return p.client?.phone
      ? whatsappLink(p.client.phone, message)
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const waiting: (AttentionItem & { since: number })[] = [];
  for (const p of projects.filter((p) => p.status === "awaiting_approval")) {
    const amount = money(p.baseline.total, p);
    waiting.push({
      key: `p-${p.id}`,
      tag: "Proposal",
      tone: "waiting",
      title: p.name,
      detail: [p.client?.name, p.sentAt && `sent ${formatAgo(p.sentAt)}`]
        .filter(Boolean)
        .join(" · "),
      amount,
      href: `/projects/${p.id}` as Route,
      remind: remind(
        p,
        links.get(p.id) ?? null,
        `Hi ${who(p)}, just checking whether you've had a chance to look at the proposal for ${p.name} (${amount}). Here's the link:`,
      ),
      since: p.sentAt?.getTime() ?? 0,
    });
  }
  for (const c of sentCrs) {
    const p = byId.get(c.projectId);
    if (!p) continue;
    const label = changeLabel(c.number);
    const amount = money(c.total, p);
    const url = links.get(p.id);
    waiting.push({
      key: `c-${c.id}`,
      tag: label,
      tone: "waiting",
      title: c.title,
      detail: [p.name, c.sentAt && `sent ${formatAgo(c.sentAt)}`]
        .filter(Boolean)
        .join(" · "),
      amount,
      href: `/projects/${p.id}/changes/${c.number}` as Route,
      remind: remind(
        p,
        url ? `${url}/changes/${c.number}` : null,
        `Hi ${who(p)}, just checking whether you've had a chance to look at ${label} for ${p.name}: ${c.title} (${amount}). Here's the link:`,
      ),
      since: c.sentAt?.getTime() ?? 0,
    });
  }
  waiting.sort((a, b) => a.since - b.since);

  // ── Needs you: client asked for changes, drafts not sent ──
  const needs: (AttentionItem & { rank: number; at: number })[] = [];
  for (const p of projects.filter((p) => p.status === "draft")) {
    const asked =
      p.lastDecision?.decision === "rejected" &&
      p.sentAt &&
      p.lastDecision.at >= p.sentAt
        ? p.lastDecision
        : null;
    needs.push({
      key: `p-${p.id}`,
      tag: asked ? "Changes asked" : p.sentAt ? "Taken back" : "Draft",
      tone: asked ? "waiting" : "neutral",
      title: p.name,
      detail: asked
        ? `${asked.name} asked ${formatAgo(asked.at)} · edit and send again`
        : p.sentAt
          ? `${p.client?.name ?? "No client"} · not sent again yet`
          : `${p.client?.name ?? "No client"} · not sent yet`,
      amount: money(p.baseline.total, p),
      href: `/projects/${p.id}` as Route,
      quote: asked?.comment ?? null,
      rank: asked ? 0 : 1,
      at: p.updatedAt.getTime(),
    });
  }
  for (const c of openChanges.filter((c) => c.status === "draft")) {
    const p = byId.get(c.projectId);
    if (!p) continue;
    needs.push({
      key: `c-${c.id}`,
      tag: `${changeLabel(c.number)} · ${c.everSent ? "Taken back" : "Draft"}`,
      tone: "neutral",
      title: c.title,
      detail: `${p.name} · not sent ${c.everSent ? "again " : ""}yet`,
      amount: money(c.total, p),
      href: `/projects/${p.id}/changes/${c.number}` as Route,
      rank: 1,
      at: c.updatedAt.getTime(),
    });
  }
  needs.sort((a, b) => a.rank - b.rank || b.at - a.at);

  return (
    <div className="grid gap-8">
      {checklist}
      <MoneyStrip rows={portfolioTotals(projects)} />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-8">
          <AttentionList
            id="waiting-title"
            title="Waiting on clients"
            description="Sent and not answered yet. The longest wait is at the top."
            items={waiting}
            empty="Nothing is waiting on a client. Proposals and change requests you send show here until they answer."
          />
          <AttentionList
            id="needs-title"
            title="Needs you"
            description="Changes your clients asked for, and drafts you haven't sent."
            items={needs}
            empty="All caught up. Drafts and anything a client asks you to change will show here."
          />
        </div>
        <section aria-labelledby="recent-title" className="grid gap-3">
          <h2 id="recent-title" className="text-[15px] font-semibold">
            Recent activity
          </h2>
          <ActivityTimeline
            visible={10}
            items={activity.map((a) => ({
              ...a,
              context: byId.has(a.projectId)
                ? {
                    label: byId.get(a.projectId)?.name ?? "",
                    href: `/projects/${a.projectId}`,
                  }
                : undefined,
            }))}
            empty="Sends, approvals and change requests across your projects will show here."
          />
        </section>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div aria-hidden className="grid gap-8">
      <div className="h-28 rounded-xl border bg-canvas" />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="h-72 rounded-xl border bg-canvas" />
        <div className="h-72 rounded-xl border bg-canvas" />
      </div>
    </div>
  );
}
