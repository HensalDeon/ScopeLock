import type { ComponentProps } from "react";
import { ActivityTimeline } from "@/modules/activity";
import { ApprovalRows } from "@/modules/approvals";
import { TitledSection } from "@/shared/ui/page";
import { SeeAll } from "@/shared/ui/see-all";

/** The latest activity and client answers, each with "See all N". */
export function ProjectHistory({
  projectId,
  activity,
  activityShown,
  approvals,
}: {
  projectId: string;
  activity: {
    items: ComponentProps<typeof ActivityTimeline>["items"];
    total: number;
  };
  activityShown: number;
  approvals: {
    items: ComponentProps<typeof ApprovalRows>["approvals"];
    total: number;
  };
}) {
  return (
    <>
      <TitledSection
        id={`activity-${projectId}`}
        title="Activity"
        action={
          <SeeAll
            href={`/projects/${projectId}/activity`}
            total={activity.total}
            shown={activity.items.length}
          />
        }
      >
        <ActivityTimeline
          items={activity.items}
          visible={activityShown}
          quotes="clamped"
          empty="Sending, approvals and change requests will show here as they happen."
        />
      </TitledSection>
      {approvals.total > 0 && (
        <TitledSection
          id={`answers-${projectId}`}
          title="Client answers"
          action={
            <SeeAll
              href={`/projects/${projectId}/answers`}
              total={approvals.total}
              shown={approvals.items.length}
            />
          }
        >
          <ApprovalRows approvals={approvals.items} projectId={projectId} />
        </TitledSection>
      )}
    </>
  );
}
