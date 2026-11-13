"use server";

import { ObjectId } from "mongodb";
import { refresh } from "next/cache";
import { z } from "zod";
import { getWorkspacePlan } from "@/modules/billing/server";
import { workspaceAction } from "@/modules/workspace/server";
import {
  getWorkspaceRole,
  listWorkspaceMembers,
  removeWorkspaceMember,
  setWorkspaceMemberRole,
} from "@/shared/auth/membership";
import { parseObjectId } from "@/shared/db/ids";
import { sendEmail } from "@/shared/email";
import { env } from "@/shared/lib/env";
import { UserError, type FormState } from "@/shared/lib/form-state";
import { generateToken, hashToken } from "@/shared/lib/token";
import { inviteEmail } from "../domain/emails";
import { inviteExpiry, sameEmail } from "../domain/invitation";
import {
  canChangeRole,
  canInviteAs,
  canRemove,
  INVITE_FIELDS,
  INVITE_ROLES,
  inviteSchema,
  placesLeft,
} from "../domain/team";
import * as repo from "./invitations-repository";

export type TeamFormState = FormState<string>;

const MANAGERS = ["owner", "admin"] as const;
const inviteUrl = (token: string) =>
  new URL(`/invite/${token}`, env().APP_URL).toString();
/** The WhatsApp message the invite link goes after. */
const shareText = (inviter: string, business: string) =>
  `${inviter} invited you to ${business} on ScopeLock. This link works once, for 7 days:`;
const idField = z
  .string()
  .refine((v) => parseObjectId(v) !== null, "That doesn't exist any more.");

async function sendInvite(input: {
  email: string;
  token: string;
  business: string;
  inviter: string;
  role: (typeof INVITE_ROLES)[number];
}) {
  await sendEmail({
    to: input.email,
    ...inviteEmail({
      business: input.business,
      inviter: input.inviter,
      role: input.role,
      url: inviteUrl(input.token),
    }),
  });
}

/** Settings → Team: invite someone by email, as an admin or a member. */
export const inviteMember = workspaceAction(
  {
    fields: INVITE_FIELDS,
    schema: inviteSchema,
    roles: [...MANAGERS],
    failureMessage: "The invite wasn't sent. Please try again.",
  },
  async ({ email, role }, { workspace, user, role: actor }) => {
    if (!canInviteAs(actor, role))
      throw new UserError("Only the owner can invite an admin.");
    const ws = workspace.workspaceId;
    const now = new Date();
    const [{ plan }, members, open] = await Promise.all([
      getWorkspacePlan(ws),
      listWorkspaceMembers(ws),
      repo.findOpenInvitations(ws, now),
    ]);
    if (members.some((m) => sameEmail(m.email, email)))
      throw new UserError(`${email} is already in this workspace.`);
    if (open.some((i) => sameEmail(i.email, email)))
      throw new UserError(
        `${email} already has an invite. Send it again from the list above.`,
      );
    if (placesLeft(plan.teamMembers, members.length, open.length) === 0)
      throw new UserError(
        plan.teamMembers <= 1
          ? `The ${plan.name} plan is for one person. Teams of up to 5 are on Agency.`
          : `The ${plan.name} plan allows ${plan.teamMembers} people, counting invites not yet accepted. Remove someone or cancel an invite first.`,
      );
    const token = generateToken();
    await repo.insertInvitation(ws, {
      email,
      role,
      tokenHash: hashToken(token),
      invitedBy: { userId: user.id, name: user.name },
      expiresAt: inviteExpiry(now),
    });
    await sendInvite({
      email,
      token,
      business: workspace.businessName,
      inviter: user.name,
      role,
    });
    refresh();
    return {
      message: `Invite sent to ${email}. You can also send them this link on WhatsApp; it works once, for 7 days.`,
      link: inviteUrl(token),
      linkText: shareText(user.name, workspace.businessName),
    };
  },
);

/** Sends an invite again with a new link (the old one stops working). */
export const resendInvite = workspaceAction(
  {
    fields: ["inviteId"] as const,
    schema: z.object({ inviteId: idField }),
    roles: [...MANAGERS],
    failureMessage: "The invite wasn't sent. Please try again.",
  },
  async ({ inviteId }, { workspace, user }) => {
    const ws = workspace.workspaceId;
    const id = new ObjectId(inviteId);
    const invite = await repo.findInvitation(ws, id);
    if (!invite || invite.acceptedAt || invite.revokedAt)
      throw new UserError("This invite isn't open any more. Refresh the page.");
    const now = new Date();
    const [{ plan }, members, open] = await Promise.all([
      getWorkspacePlan(ws),
      listWorkspaceMembers(ws),
      repo.findOpenInvitations(ws, now),
    ]);
    // An expired invite comes back as an open one: it needs a free place.
    const revived = invite.expiresAt <= now;
    if (
      members.length >= plan.teamMembers ||
      (revived &&
        placesLeft(plan.teamMembers, members.length, open.length) === 0)
    )
      throw new UserError(
        `There's no place for them on ${plan.name} right now. Cancel the invite, or make room first.`,
      );
    const token = generateToken();
    const ok = await repo.renewInvitation(
      ws,
      id,
      hashToken(token),
      inviteExpiry(new Date()),
    );
    if (!ok)
      throw new UserError("This invite isn't open any more. Refresh the page.");
    await sendInvite({
      email: invite.email,
      token,
      business: workspace.businessName,
      inviter: user.name,
      role: invite.role,
    });
    refresh();
    return {
      message: `Sent again to ${invite.email}. The old link no longer works; this one does.`,
      link: inviteUrl(token),
      linkText: shareText(user.name, workspace.businessName),
    };
  },
);

/** Cancels an invite before it's accepted; its link stops working. */
export const cancelInvite = workspaceAction(
  {
    fields: ["inviteId"] as const,
    schema: z.object({ inviteId: idField }),
    roles: [...MANAGERS],
  },
  async ({ inviteId }, { workspace }) => {
    const id = new ObjectId(inviteId);
    const invite = await repo.findInvitation(workspace.workspaceId, id);
    const ok = await repo.revokeInvitation(workspace.workspaceId, id);
    if (!ok || !invite)
      throw new UserError("This invite isn't open any more. Refresh the page.");
    refresh();
    return {
      message:
        invite.expiresAt <= new Date()
          ? `${invite.email}'s expired invite is off the list.`
          : `Invite for ${invite.email} cancelled. Its link no longer works.`,
    };
  },
);

/** The owner makes someone an admin or a member. */
export const changeMemberRole = workspaceAction(
  {
    fields: ["userId", "role"] as const,
    schema: z.object({ userId: z.string().min(1), role: z.enum(INVITE_ROLES) }),
    roles: ["owner"],
  },
  async ({ userId, role }, { workspace, role: actor }) => {
    const target = await getWorkspaceRole(userId, workspace.workspaceId);
    if (!target || !canChangeRole(actor, target))
      throw new UserError("That role can't be changed.");
    await setWorkspaceMemberRole(workspace.workspaceId, userId, role);
    const name = (await listWorkspaceMembers(workspace.workspaceId))
      .find((m) => m.userId === userId)
      ?.name.split(" ")[0];
    refresh();
    return {
      message: `${name ?? "They"} ${name ? "is" : "are"} now ${role === "admin" ? "an admin" : "a member"}.`,
    };
  },
);

/** Takes someone out of the workspace. Their work stays. */
export const removeMember = workspaceAction(
  {
    fields: ["userId"] as const,
    schema: z.object({ userId: z.string().min(1) }),
    roles: [...MANAGERS],
  },
  async ({ userId }, { workspace, user, role: actor }) => {
    if (userId === user.id)
      throw new UserError("To leave, use Leave this workspace.");
    const target = await getWorkspaceRole(userId, workspace.workspaceId);
    if (!target) throw new UserError("They've already left. Refresh the page.");
    if (!canRemove(actor, target))
      throw new UserError("Only the owner can remove an admin.");
    await removeWorkspaceMember(workspace.workspaceId, userId);
    refresh();
    return {
      message: "Removed. What they did stays in each project's history.",
    };
  },
);
