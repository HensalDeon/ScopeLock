import { ActivityTimeline } from "@/modules/activity";
import type { OverviewData } from "../server/queries";
import { AttentionList } from "./attention-list";
import { MoneyStrip } from "./money-strip";
import { SetupChecklist } from "./setup-checklist";

/** The overview page body: renders what getOverview() worked out. */
export function OverviewView({ data }: { data: OverviewData }) {
  const checklist = data.setup && <SetupChecklist steps={data.setup} />;
  if (!data.hasProjects) return <div className="grid gap-8">{checklist}</div>;

  return (
    <div className="grid gap-8">
      {checklist}
      <MoneyStrip rows={data.money} gst={data.gst} />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-8">
          <AttentionList
            id="waiting-title"
            title="Waiting on clients"
            description="Sent and not answered yet. The longest wait is at the top."
            items={data.waiting}
            empty="Nothing is waiting on a client. Proposals and change requests you send show here until they answer."
          />
          <AttentionList
            id="needs-title"
            title="Needs you"
            description="Changes your clients asked for, and drafts you haven't sent."
            items={data.needs}
            empty="All caught up. Drafts and anything a client asks you to change will show here."
          />
        </div>
        <section aria-labelledby="recent-title" className="grid gap-3">
          <h2 id="recent-title" className="text-[15px] font-semibold">
            Recent activity
          </h2>
          <ActivityTimeline
            visible={6}
            quotes="hidden"
            items={data.activity.map(({ project, ...a }) => ({
              ...a,
              context: project
                ? { label: project.name, href: project.href }
                : undefined,
            }))}
            empty="Sends, approvals and change requests across your projects will show here."
          />
          {data.activity.length >= 6 && (
            <p className="text-xs text-muted-foreground">
              Full history is on each project&apos;s page.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export function OverviewSkeleton() {
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
