import Link from "next/link";
import { formatDate } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Section } from "@/shared/ui/page";
import { canInviteAs, INVITE_ROLES, ROLE_LABELS } from "../domain/team";
import { cancelInvite, resendInvite } from "../server/actions";
import type { TeamPage } from "../server/queries";
import { ActionButton } from "./action-button";
import { InviteForm } from "./invite-form";
import { LeaveButton } from "./leave-button";
import { MemberActions } from "./member-actions";

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
  const open = team.invites.filter((i) => !i.expired);
  const used = team.members.length + open.length;
  return (
    <div className="grid gap-2">
      {paused.length > 0 && (
        <div className="mb-6 grid max-w-prose justify-items-start gap-3 rounded-lg border border-warning/25 bg-warning-soft px-4 py-3 text-sm text-pretty text-warning-ink">
          <p>
            {solo
              ? `${plan.name} is for one person, so ${paused.map((m) => m.name).join(", ")} can't open this workspace right now. They stay in the team and get access back when you move to ${team.teamPlan ? `${team.teamPlan.name} (up to ${team.teamPlan.seats} people, ${team.teamPlan.price} a month)` : "a plan with a team"}.`
              : `On ${plan.name}, only ${people(plan.seats)} can open this workspace, so ${paused.map((m) => m.name).join(", ")} can't right now. They stay in the team and get access back when the plan allows more people, or when you remove someone.`}
          </p>
          {team.teamPlan && you.role === "owner" && (
            <Button asChild variant="outline" size="sm">
              <Link href="/settings/plan">
                See the {team.teamPlan.name} plan
              </Link>
            </Button>
          )}
        </div>
      )}

      <Section
        title="People"
        description={
          solo && team.members.length === 1 && team.invites.length === 0 ? (
            `Only you, as the owner. ${team.teamPlan?.name ?? "Agency"} adds admins and members.`
          ) : (
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
          )
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
                  className="grid gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5"
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
                        <span className={cn(PILL, IDLE_PILL)}>
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
                className="grid gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5"
              >
                <div className="grid min-w-0 gap-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span className="[overflow-wrap:anywhere]">{i.email}</span>
                    {i.expired ? (
                      <span className={cn(PILL, IDLE_PILL)}>
                        Expired {formatDate(i.expiresAt)}
                      </span>
                    ) : team.canJoin ? (
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
                      !i.expired &&
                      (solo
                        ? `They can join once you're on ${team.teamPlan?.name ?? "a plan with a team"}. `
                        : "They can join once there's a place. ")}
                    Sent by {i.invitedBy}{" "}
                    <span className="whitespace-nowrap">
                      {formatDate(i.sentAt)}
                    </span>{" "}
                    {!i.expired && (
                      <>
                        · link works until{" "}
                        <span className="whitespace-nowrap">
                          {formatDate(i.expiresAt)}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                {team.canManage && (
                  <div className="flex flex-wrap items-start gap-1 sm:justify-end">
                    {team.canJoin && (!i.expired || team.placesLeft > 0) && (
                      <ActionButton
                        action={resendInvite}
                        fields={{ inviteId: i.id }}
                        label="Send again"
                        pendingLabel="Sending…"
                        srSuffix={`to ${i.email}`}
                      />
                    )}
                    {i.expired ? (
                      <ActionButton
                        action={cancelInvite}
                        fields={{ inviteId: i.id }}
                        label="Remove"
                        pendingLabel="Removing…"
                        srSuffix={`the expired invite for ${i.email}`}
                        danger
                        focusId={PEOPLE_ID}
                      />
                    ) : (
                      <ActionButton
                        action={cancelInvite}
                        fields={{ inviteId: i.id }}
                        label="Cancel invite"
                        pendingLabel="Cancelling…"
                        srSuffix={`for ${i.email}`}
                        danger
                        confirm={{
                          question: `Cancel the invite for ${i.email}? Its link stops working.`,
                          yes: "Cancel the invite",
                        }}
                        focusId={PEOPLE_ID}
                      />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {!solo && (
            <p className="border-t bg-canvas px-4 py-2.5 text-sm tabular-nums sm:px-5">
              {used} of {plan.seats} places used on {plan.name}
              {open.length > 0 &&
                `, counting ${open.length === 1 ? "1 invite" : `${open.length} invites`}`}
              .
              {team.canManage && team.invites.length > 0 && (
                <span className="block text-[13px] text-muted-foreground">
                  Send again emails a new link and shows it here to copy; the
                  old link stops working.
                </span>
              )}
            </p>
          )}
        </div>
      </Section>

      {team.canManage &&
        (solo ? (
          paused.length > 0 ? null : (
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
          )
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
