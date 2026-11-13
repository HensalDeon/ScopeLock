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

const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

/**
 * Settings → Team: who's in the workspace and as what, open invites, and
 * inviting someone. Members see the list; owners and admins manage it.
 */
export function TeamSettings({ team }: { team: TeamPage }) {
  const { you, plan } = team;
  const solo = plan.seats <= 1;
  const paused = team.members.filter((m) => !m.hasAccess);
  const roles = INVITE_ROLES.filter((r) => canInviteAs(you.role, r));
  return (
    <div className="grid gap-2">
      <p className="mb-6 max-w-prose text-sm text-pretty text-muted-foreground">
        {solo
          ? `The ${plan.name} plan is for one person. On Agency, up to 5 people work in this workspace: proposals, change requests and payments, each under their own name.`
          : `${people(team.members.length)} of ${plan.seats} on ${plan.name}. Everyone does project work under their own name; owners and admins also manage settings and the team.`}
      </p>

      {paused.length > 0 && (
        <p
          role="status"
          className="mb-6 max-w-prose rounded-lg border border-warning/25 bg-warning-soft px-4 py-3 text-sm text-pretty text-warning-ink"
        >
          {`The ${plan.name} plan allows ${people(plan.seats)}, so ${paused.map((m) => m.name).join(", ")} can't open this workspace until the plan allows more, or someone is removed.`}
        </p>
      )}

      <Section title="People" description="Who's in this workspace.">
        <ul className="divide-y rounded-xl border bg-background">
          {team.members.map((m) => {
            const isYou = m.userId === you.userId;
            return (
              <li
                key={m.userId}
                className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
              >
                <div className="grid min-w-0 gap-0.5">
                  <p className="text-sm font-medium">
                    {m.name}
                    {isYou && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-[13px] break-all text-muted-foreground">
                    {m.email}
                  </p>
                  <p className="text-[13px] text-muted-foreground tabular-nums">
                    {ROLE_LABELS[m.role].title}
                    {m.role !== "owner" &&
                      ` · joined ${formatDate(m.joinedAt)}`}
                    {!m.hasAccess && (
                      <span className="text-warning-ink">
                        {" "}
                        · no access on {plan.name}
                      </span>
                    )}
                  </p>
                </div>
                <MemberActions member={m} you={you.role} isYou={isYou} />
              </li>
            );
          })}
        </ul>
      </Section>

      {team.canManage && !solo && (
        <Section
          title="Invite someone"
          description="They'll get an email with a link that works once, for 7 days. They join with that email address."
        >
          {team.placesLeft > 0 ? (
            <InviteForm roles={roles} />
          ) : (
            <p className="text-sm text-pretty text-muted-foreground">
              {`All ${plan.seats} places are taken, counting invites not yet accepted. Remove someone or cancel an invite to invite another person.`}
            </p>
          )}
        </Section>
      )}

      {team.canManage && solo && (
        <Section title="Invite someone">
          <div className="grid justify-items-start gap-3">
            <p className="text-sm text-pretty text-muted-foreground">
              Teams of up to 5 people are on the Agency plan.
            </p>
            <Button asChild variant="outline">
              <Link href="/settings/plan">See the Agency plan</Link>
            </Button>
          </div>
        </Section>
      )}

      {team.invites.length > 0 && (
        <Section
          title="Invites not accepted yet"
          description="Sending again makes a new link; the old one stops working."
        >
          <ul className="divide-y rounded-xl border bg-background">
            {team.invites.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
              >
                <div className="grid min-w-0 gap-0.5">
                  <p className="text-sm font-medium break-all">{i.email}</p>
                  <p className="text-[13px] text-muted-foreground tabular-nums">
                    {ROLE_LABELS[i.role].title} · sent by {i.invitedBy}{" "}
                    {formatDate(i.sentAt)} · works until{" "}
                    {formatDate(i.expiresAt)}
                  </p>
                </div>
                {team.canManage && (
                  <div className="flex flex-wrap gap-1">
                    <ActionButton
                      action={resendInvite}
                      fields={{ inviteId: i.id }}
                      label="Send again"
                      pendingLabel="Sending…"
                    />
                    <ActionButton
                      action={cancelInvite}
                      fields={{ inviteId: i.id }}
                      label="Cancel invite"
                      pendingLabel="Cancelling…"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

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
  const change = canChangeRole(you, member.role);
  const remove = canRemove(you, member.role);
  if (!change && !remove) return null;
  const to = member.role === "admin" ? "member" : "admin";
  return (
    <div className={cn("flex flex-wrap gap-1")}>
      {change && (
        <ActionButton
          action={changeMemberRole}
          fields={{ userId: member.userId, role: to }}
          label={to === "admin" ? "Make admin" : "Make member"}
          pendingLabel="Saving…"
        />
      )}
      {remove && (
        <ActionButton
          action={removeMember}
          fields={{ userId: member.userId }}
          label="Remove"
          pendingLabel="Removing…"
          confirm={`Remove ${member.name}? They'll stop seeing this workspace. What they did stays in each project's history.`}
        />
      )}
    </div>
  );
}
