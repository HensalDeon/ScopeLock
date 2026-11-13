import { SignOutButton } from "@/modules/account";
import type { PausedAccess } from "../server/queries";
import { LeaveButton } from "./leave-button";
import { SwitchWorkspaceButton } from "./switch-workspace-button";

/** /team-access: why this workspace won't open, and where to go instead. */
export function PausedView({ access }: { access: PausedAccess }) {
  const seats =
    access.plan.seats === 1 ? "one person" : `${access.plan.seats} people`;
  const who = access.owner ?? "the owner";
  return (
    <div className="grid gap-5">
      <div className="grid gap-3">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
          {access.business} isn&apos;t open to you right now
        </h1>
        <p className="text-[15px] text-pretty text-muted-foreground">
          {`It moved to the ${access.plan.name} plan, which allows ${seats}${access.plan.seats === 1 ? `: ${who}` : ", the owner and the earliest to join"}. You're still in the team. Your access comes back by itself when ${who} moves to a plan with more people, or makes room.`}
        </p>
      </div>
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
      <div className="grid gap-2 border-t pt-5">
        <p className="text-sm text-pretty text-muted-foreground">
          Not working with {access.business} any more? Leave the team, and you
          can set up your own workspace.
        </p>
        <LeaveButton />
      </div>
      <div>
        <SignOutButton />
      </div>
    </div>
  );
}
