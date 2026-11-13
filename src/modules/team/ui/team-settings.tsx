import Link from "next/link";
import { formatDate } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Section } from "@/shared/ui/page";
import {
  canChangeRole,
  canInviteAs,
  canRemove,
  INVITE_ROLES,
  ROLE_LABELS,
  type TeamRole,
} from "../domain/team";
import {
  cancelInvite,
  changeMemberRole,
  removeMember,
  resendInvite,
} from "../server/actions";
import type { TeamPage } from "../server/queries";
import { ActionButton } from "./action-button";
import { InviteForm } from "./invite-form";
import { LeaveButton } from "./leave-button";

const PILL =
  "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap";
const IDLE_PILL = "border-border bg-muted text-muted-foreground";
const WAITING_PILL = "border-warning/25 bg-warning-soft text-warning-ink";
const PEOPLE_ID = "team-people";

const people = (n: number) => (n === 1 ? "1 person" : `${n} people`);

/**
 * Settings → Team: who's in the workspace (and who's invited), as what,
 * how many places are used; inviting someone. Members see the list; owners
 * and admins manage it.
 */
export function TeamSettings({ team }: { team: TeamPage }) {
  const { you, plan } = team;
  const solo = plan.seats <= 1;
  const paused = team.members.filter((m) => !m.hasAccess);
  const roles = INVITE_ROLES.filter((r) => canInviteAs(you.role, r));
  const used = team.members.length + team.invites.length;
  return (
    <div className="grid gap-2">
      {paused.length > 0 && (
        <p className="mb-6 max-w-prose rounded-lg border border-warning/25 bg-warning-soft px-4 py-3 text-sm text-pretty text-warning-ink">
          {solo
            ? `${plan.name} is for one person, so ${paused.map((m) => m.name).join(", ")} can't open this workspace right now. They stay in the team and get access back when you move to ${team.teamPlan ? `${team.teamPlan.name} (up to ${team.teamPlan.seats} people, ${team.teamPlan.price} a month)` : "a plan with a team"}.`
            : `On ${plan.name}, only ${people(plan.seats)} can open this workspace, so ${paused.map((m) => m.name).join(", ")} can't right now. They stay in the team and get access back when the plan allows more people, or when you remove someone.`}
        </p>
      )}

      <Section
        title="People"
        description={
          <span className="grid gap-2">
            {(["owner", "admin", "member"] as const).map((r) => (
              <span key={r}>
                <span className="font-medium text-foreground">
                  {ROLE_LABELS[r].title}:
                </span>{" "}
                {ROLE_LABELS[r].detail}
              </span>
            ))}
          </span>
        }
      >
        <div className="overflow-hidden rounded-xl border bg-background">
          <h3 id={PEOPLE_ID} tabIndex={-1} className="sr-only">
            People in this workspace
          </h3>
          <ul aria-labelledby={PEOPLE_ID} className="divide-y">
            {team.members.map((m) => {
              const isYou = m.userId === you.userId;
              return (
                <li
                  key={m.userId}
                  className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
                >
                  <div className="grid min-w-0 gap-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {m.name}
                      {isYou && (
                        <span className="font-normal text-muted-foreground">
                          (you)
                        </span>
                      )}
                      <span className={cn(PILL, IDLE_PILL)}>
                        {ROLE_LABELS[m.role].title}
                      </span>
                      {!m.hasAccess && (
                        <span className={cn(PILL, WAITING_PILL)}>
                          <span
                            aria-hidden
                            className="size-1.5 rounded-full bg-warning"
                          />
                          Paused on {plan.name}
                        </span>
                      )}
                    </p>
                    <p className="text-[13px] [overflow-wrap:anywhere] text-muted-foreground">
                      {m.email}
                      {m.role !== "owner" && (
                        <span className="whitespace-nowrap tabular-nums">
                          {" "}
                          · joined {formatDate(m.joinedAt)}
                        </span>
                      )}
                    </p>
                  </div>
                  <MemberActions member={m} you={you.role} isYou={isYou} />
                </li>
              );
            })}
            {team.invites.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
              >
                <div className="grid min-w-0 gap-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span className="[overflow-wrap:anywhere]">{i.email}</span>
                    {team.canJoin ? (
                      <span className={cn(PILL, WAITING_PILL)}>
                        <span
                          aria-hidden
                          className="size-1.5 rounded-full bg-warning"
                        />
                        Invited as {ROLE_LABELS[i.role].title.toLowerCase()}
                      </span>
                    ) : (
                      <span className={cn(PILL, IDLE_PILL)}>
                        Can&apos;t join on {plan.name}
                      </span>
                    )}
                  </p>
                  <p className="text-[13px] text-muted-foreground tabular-nums">
                    {!team.canJoin &&
                      (solo
                        ? `They can join once you're on ${team.teamPlan?.name ?? "a plan with a team"}. `
                        : "They can join once there's a place. ")}
                    Sent by {i.invitedBy}{" "}
                    <span className="whitespace-nowrap">
                      {formatDate(i.sentAt)}
                    </span>{" "}
                    · link works until{" "}
                    <span className="whitespace-nowrap">
                      {formatDate(i.expiresAt)}
                    </span>
                  </p>
                </div>
                {team.canManage && (
                  <div className="flex flex-wrap items-start justify-end gap-1">
                    {team.canJoin && (
                      <ActionButton
                        action={resendInvite}
                        fields={{ inviteId: i.id }}
                        label="Send again"
                        pendingLabel="Sending…"
                        ariaLabel={`Send the invite to ${i.email} again`}
                      />
                    )}
                    <ActionButton
                      action={cancelInvite}
                      fields={{ inviteId: i.id }}
                      label="Cancel invite"
                      pendingLabel="Cancelling…"
                      ariaLabel={`Cancel the invite for ${i.email}`}
                      danger
                      confirm={{
                        question: `Cancel the invite for ${i.email}? Its link stops working.`,
                        yes: "Cancel the invite",
                      }}
                      focusId={PEOPLE_ID}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
          {!solo && (
            <p className="border-t bg-canvas px-4 py-2.5 text-sm tabular-nums sm:px-5">
              {used} of {plan.seats} places used on {plan.name}
              {team.invites.length > 0 &&
                `, counting ${team.invites.length === 1 ? "1 invite" : `${team.invites.length} invites`}`}
              .
            </p>
          )}
        </div>
      </Section>

      {team.canManage &&
        (solo ? (
          <Section title="Invite someone">
            <div className="grid justify-items-start gap-3">
              <p className="text-sm text-pretty text-muted-foreground">
                {team.teamPlan
                  ? `${plan.name} is for one person. On ${team.teamPlan.name} (${team.teamPlan.price} a month), up to ${team.teamPlan.seats} people work here, each under their own name.`
                  : `${plan.name} is for one person.`}
              </p>
              <Button asChild variant="outline">
                <Link href="/settings/plan">
                  See the {team.teamPlan?.name ?? "Agency"} plan
                </Link>
              </Button>
            </div>
          </Section>
        ) : (
          <Section
            title="Invite someone"
            description="We email them a link that works once, for 7 days. They join with that email address."
          >
            {team.placesLeft > 0 ? (
              <InviteForm roles={roles} />
            ) : (
              <p className="text-sm text-pretty text-muted-foreground">
                {`All ${plan.seats} places are used, counting invites not yet accepted. Remove someone or cancel an invite to invite another person.`}
              </p>
            )}
          </Section>
        ))}

      {you.role !== "owner" && (
        <Section
          title="Leave this workspace"
          description="You'll stop seeing its projects. What you did stays in each project's history."
        >
          <LeaveButton />
        </Section>
      )}
    </div>
  );
}

function MemberActions({
  member,
  you,
  isYou,
}: {
  member: TeamPage["members"][number];
  you: TeamRole;
  isYou: boolean;
}) {
  if (isYou) return null;
  // A paused member can't be made an admin until they're back in.
  const change = canChangeRole(you, member.role) && member.hasAccess;
  const remove = canRemove(you, member.role);
  if (!change && !remove) return null;
  const to = member.role === "admin" ? "member" : "admin";
  return (
    <div className="flex flex-wrap items-start justify-end gap-3">
      {change && (
        <ActionButton
          action={changeMemberRole}
          fields={{ userId: member.userId, role: to }}
          label={to === "admin" ? "Make admin" : "Make member"}
          pendingLabel="Saving…"
          ariaLabel={`Make ${member.name} ${to === "admin" ? "an admin" : "a member"}`}
        />
      )}
      {remove && (
        <ActionButton
          action={removeMember}
          fields={{ userId: member.userId }}
          label="Remove"
          pendingLabel="Removing…"
          ariaLabel={`Remove ${member.name}`}
          danger
          confirm={{
            question: `Remove ${member.name}? They stop seeing this workspace at once. What they did stays in each project's history.`,
            yes: `Remove ${member.name.split(" ")[0]}`,
          }}
          focusId={PEOPLE_ID}
        />
      )}
    </div>
  );
}
