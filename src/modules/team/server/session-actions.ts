"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getWorkspacePlan } from "@/modules/billing/server";
import {
  addWorkspaceMember,
  findAccount,
  getWorkspaceRole,
  listWorkspaceMembers,
  removeWorkspaceMember,
} from "@/shared/auth/membership";
import { auth } from "@/shared/auth/server";
import { requireFreshSession } from "@/shared/auth/session";
import type { FormState } from "@/shared/lib/form-state";
import { hashToken } from "@/shared/lib/token";
import { sameEmail } from "../domain/invitation";
import { findInvitationByTokenHash } from "./invite-lookup";
import * as repo from "./invitations-repository";

/**
 * Team actions that act on the signed-in person rather than a workspace
 * they manage: accepting an invite, leaving, switching workspace.
 */

type TeamFormState = FormState<string>;

/** A member or admin leaves; the owner can't. */
export async function leaveWorkspace(): Promise<TeamFormState> {
  const { user, session } = await requireFreshSession();
  const ws = session.activeOrganizationId;
  const role = ws ? await getWorkspaceRole(user.id, ws) : null;
  if (!ws || !role) redirect("/dashboard");
  if (role === "owner")
    return {
      status: "error",
      message: "The owner can't leave their own workspace.",
    };
  await removeWorkspaceMember(ws, user.id);
  redirect("/dashboard");
}

/** /invite/<token>: joins the workspace, then opens it. */
export async function acceptInvite(
  _previous: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const token = String(formData.get("token") ?? "");
  const { user } = await requireFreshSession();
  const invite = /^[A-Za-z0-9_-]{20,100}$/.test(token)
    ? await findInvitationByTokenHash(hashToken(token))
    : null;
  const gone = {
    status: "error" as const,
    message:
      "This invite can't be used any more. Ask for a new one from whoever invited you.",
  };
  if (!invite) return gone;
  const account = await findAccount(user.id);
  if (!account || !sameEmail(account.email, invite.email))
    return {
      status: "error",
      message: `This invite is for ${invite.email}. Sign in with that email to accept it.`,
    };
  if (!account.emailVerified)
    return {
      status: "error",
      message: "Confirm your email first, with the code we sent you.",
    };
  const ws = invite.workspaceId;
  const [{ plan }, members] = await Promise.all([
    getWorkspacePlan(ws),
    listWorkspaceMembers(ws),
  ]);
  if (!members.some((m) => m.userId === user.id)) {
    if (members.length >= plan.teamMembers)
      return {
        status: "error",
        message: `This workspace's plan has no place left. Ask ${invite.invitedBy.name} to make room, then open this link again.`,
      };
    if (!(await repo.markAccepted(ws, invite._id, user.id, new Date())))
      return gone;
    await addWorkspaceMember(ws, user.id, invite.role);
  }
  await auth.api.setActiveOrganization({
    body: { organizationId: ws },
    headers: await headers(),
  });
  redirect("/dashboard");
}

/** The sidebar's switcher: opens another workspace you belong to. */
export async function switchWorkspace(
  _previous: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const { user } = await requireFreshSession();
  if (!(await getWorkspaceRole(user.id, workspaceId)))
    return {
      status: "error",
      message: "You're not in that workspace any more.",
    };
  await auth.api.setActiveOrganization({
    body: { organizationId: workspaceId },
    headers: await headers(),
  });
  redirect("/dashboard");
}
