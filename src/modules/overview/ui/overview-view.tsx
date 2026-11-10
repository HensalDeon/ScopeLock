import { ActivityTimeline } from "@/modules/activity";
import { formatMoney } from "@/shared/lib/money";
import type { OverviewData } from "../server/queries";
import { AttentionList } from "./attention-list";
import { MoneyStrip } from "./money-strip";
import { RecoveredStrip } from "./recovered-strip";
import { SetupChecklist } from "./setup-checklist";
import { SetupVisibility } from "./setup-visibility";

/** The overview page body: renders what getOverview() worked out. */
export function OverviewView({ data }: { data: OverviewData }) {
  // Before anything is approved the checklist leads; after, money does and
  // the remaining steps fold into one line under the lists.
  const approved = data.money.some((r) => r.approvedProjects > 0);
  const checklist = data.setup && !data.setupHidden && (
    <SetupChecklist steps={data.setup} folded={approved} />
  );
  // Hidden by hand but not finished: one quiet way back.
  const showAgain = data.setup && data.setupHidden && (
    <SetupVisibility
      hide={false}
      label={`Show the setup steps (${data.setup.filter((s) => s.done).length} of ${data.setup.length} done)`}
      className="justify-self-start"
    />
  );
  if (!data.hasProjects)
    return (
      <div className="grid gap-8">
        {checklist}
        {showAgain}
      </div>
    );
  const awaiting = data.money
    .filter((r) => r.waiting > 0)
    .map((r) => formatMoney(r.waiting, r.currency))
    .join(" + ");

  return (
    <div className="grid gap-8">
      {!approved && checklist}
      <div className="grid gap-3">
        <MoneyStrip rows={data.money} />
        <RecoveredStrip rows={data.recovered} />
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-8">
          <AttentionList
            id="needs-title"
            title="Needs you"
            description="Payments to confirm, changes your clients asked for, the next payment to ask for, and drafts you haven't sent."
            items={data.needs}
            empty="All caught up. Payments to confirm or ask for, drafts, and anything a client asks you to change will show here."
          />
          <AttentionList
            id="waiting-title"
            title="Waiting on clients"
            description={`Proposals, change requests and payments your clients haven't answered or paid${awaiting ? ` (${awaiting} awaiting approval)` : ""}. The longest wait is at the top.`}
            items={data.waiting}
            empty="Nothing is waiting on a client. Proposals, change requests and payment requests you send show here until they answer or pay."
          />
          {approved && checklist}
          {showAgain}
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

/** The overview's shape while it loads: four figure cells, then rows. */
export function OverviewSkeleton() {
  const bar = (w: string, tone = "bg-muted") => (
    <div className={`h-3 rounded ${w} ${tone}`} />
  );
  return (
    <div aria-hidden className="grid gap-8">
      <div className="grid grid-cols-2 rounded-xl border bg-background lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="grid gap-3 border-b px-5 py-4 odd:border-r lg:border-r lg:border-b-0 lg:last:border-r-0"
          >
            {bar("w-16", "bg-muted/70")}
            <div className="h-6 w-24 rounded bg-muted" />
            {bar("w-28", "bg-muted/70")}
          </div>
        ))}
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-3">
          {bar("w-24")}
          <div className="divide-y rounded-xl border bg-background">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="grid flex-1 gap-2">
                  {bar("w-20", "bg-muted/70")}
                  {bar("w-44")}
                  {bar("w-56", "bg-muted/70")}
                </div>
                {bar("w-16")}
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          {bar("w-28")}
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid gap-2 pl-5">
              {bar("w-48", "bg-muted/70")}
              {bar("w-32", "bg-muted/50")}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
