import { canChangeRole, canRemove, type TeamRole } from "../domain/team";
import { changeMemberRole, removeMember } from "../server/actions";
import type { TeamPage } from "../server/queries";
import { ActionButton } from "./action-button";

/** The People list's heading: focus lands here after someone is removed. */
const PEOPLE_ID = "team-people";

/** Make admin / member and Remove, for whoever may (never on yourself). */
export function MemberActions({
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
    <div className="flex flex-wrap items-start gap-3 sm:justify-end">
      {change && (
        <ActionButton
          action={changeMemberRole}
          fields={{ userId: member.userId, role: to }}
          label={to === "admin" ? "Make admin" : "Make member"}
          pendingLabel="Saving…"
          srSuffix={`: ${member.name}`}
        />
      )}
      {remove && (
        <ActionButton
          action={removeMember}
          fields={{ userId: member.userId }}
          label="Remove"
          pendingLabel="Removing…"
          srSuffix={member.name}
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
