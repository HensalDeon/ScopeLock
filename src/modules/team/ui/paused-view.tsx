import { SignOutButton } from "@/modules/account";
import type { PausedAccess } from "../server/queries";
import { SwitchWorkspaceButton } from "./switch-workspace-button";

/** /team-access: why this workspace won't open, and where to go instead. */
export function PausedView({ access }: { access: PausedAccess }) {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
        {access.business} isn&apos;t open to you right now
      </h1>
      <p className="text-[15px] text-pretty text-muted-foreground">
        {`Its ${access.plan.name} plan allows ${access.plan.seats === 1 ? "one person" : `${access.plan.seats} people`}, so only ${access.plan.seats === 1 ? "the owner" : "the owner and the earliest to join"} can open it. ${access.owner ? `Ask ${access.owner} to` : "Ask the owner to"} move to a plan with more people; your access comes back by itself.`}
      </p>
      {access.others.length > 0 && (
        <div className="grid gap-2">
          <p className="text-sm font-medium">Open another workspace</p>
          <div className="flex flex-wrap gap-2">
            {access.others.map((w) => (
              <SwitchWorkspaceButton
                key={w.workspaceId}
                workspaceId={w.workspaceId}
                label={`Open ${w.name}`}
              />
            ))}
          </div>
        </div>
      )}
      <div>
        <SignOutButton />
      </div>
    </div>
  );
}
