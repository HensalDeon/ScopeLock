import { SignOutButton } from "@/modules/account";
import { Button } from "@/shared/ui/button";
import { CopyValue } from "@/shared/ui/copy-value";
import { TOUCH } from "@/shared/ui/touch";
import type { PausedAccess } from "../server/queries";
import { LeaveButton } from "./leave-button";
import { SwitchWorkspaceButton } from "./switch-workspace-button";

/**
 * /team-access: why this workspace won't open, who can fix it (an email to
 * the owner first), and other ways on. Leaving is there, but quiet.
 */
export function PausedView({ access }: { access: PausedAccess }) {
  const owner = access.owner?.name ?? "the owner";
  const solo = access.plan.seats <= 1;
  const subject = `Access to ${access.business} on ScopeLock`;
  return (
    <div className="grid gap-5">
      <div className="grid gap-3">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
          {access.business} isn&apos;t open to you right now
        </h1>
        <p className="text-[15px] text-pretty text-muted-foreground">
          {solo
            ? `It's on the ${access.plan.name} plan, which is for one person: ${owner}. You're still in the team, and your access comes back by itself when they move to a plan with a team.`
            : `It's on the ${access.plan.name} plan, which allows ${access.plan.seats} people: the owner and the earliest to join. You're still in the team, and your access comes back by itself when there's a place for you.`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {access.owner && (
          <Button asChild className={TOUCH}>
            <a
              href={`mailto:${access.owner.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Hi ${access.owner.name}, ${access.business}'s ScopeLock plan doesn't have a place for me right now, so I can't open its projects. Could you move it to a plan with a team?`)}`}
            >
              Email {access.owner.name}
            </a>
          </Button>
        )}
        {access.others.map((w) => (
          <SwitchWorkspaceButton
            key={w.workspaceId}
            workspaceId={w.workspaceId}
            label={`Open ${w.name}`}
          />
        ))}
      </div>
      {access.owner && (
        <div className="grid gap-1 text-sm">
          <p className="text-muted-foreground">No email app? Their address:</p>
          <CopyValue value={access.owner.email} label="email address" />
        </div>
      )}
      <div className="grid justify-items-start gap-2 border-t pt-5">
        <p className="text-sm text-pretty text-muted-foreground">
          Not working with {access.business} any more? Leaving also lets you set
          up your own workspace.
        </p>
        <LeaveButton quiet />
        <SignOutButton className="px-0" />
      </div>
    </div>
  );
}
