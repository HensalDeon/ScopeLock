"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { findDefaultWorkspaceId } from "@/shared/auth/membership";
import { auth } from "@/shared/auth/server";
import { requireSession } from "@/shared/auth/session";
import {
  workspaceDetailsSchema,
  workspaceSlug,
  type WorkspaceDetailsInput,
} from "../domain/workspace";
import { requireWorkspace } from "./context";
import { getWorkspaceProfile, saveWorkspaceProfile } from "./repository";

export type WorkspaceFormState = {
  status: "idle" | "error" | "saved";
  message?: string;
  fieldErrors?: Partial<Record<keyof WorkspaceDetailsInput, string>>;
  /** Echoed back so the form keeps what was typed after an error. */
  values?: WorkspaceDetailsInput;
};

function readForm(formData: FormData): WorkspaceDetailsInput {
  return {
    businessName: String(formData.get("businessName") ?? ""),
    businessType: String(
      formData.get("businessType") ?? "",
    ) as WorkspaceDetailsInput["businessType"],
    phone: String(formData.get("phone") ?? ""),
  };
}

function invalid(
  values: WorkspaceDetailsInput,
  issues: { path: PropertyKey[]; message: string }[],
): WorkspaceFormState {
  const fieldErrors: WorkspaceFormState["fieldErrors"] = {};
  for (const issue of issues) {
    const key = issue.path[0] as keyof WorkspaceDetailsInput;
    fieldErrors[key] ??= issue.message;
  }
  return { status: "error", fieldErrors, values };
}

/** Onboarding: create the user's workspace and its profile. */
export async function setUpWorkspace(
  _prev: WorkspaceFormState,
  formData: FormData,
): Promise<WorkspaceFormState> {
  const { user } = await requireSession();
  const values = readForm(formData);
  const parsed = workspaceDetailsSchema.safeParse(values);
  if (!parsed.success) return invalid(values, parsed.error.issues);

  const requestHeaders = await headers();

  try {
    // Re-use a workspace left half-finished by an earlier attempt.
    let workspaceId = await findDefaultWorkspaceId(user.id);
    if (workspaceId && (await getWorkspaceProfile(workspaceId))) {
      redirect("/dashboard");
    }

    if (workspaceId) {
      await auth.api.updateOrganization({
        body: {
          organizationId: workspaceId,
          data: { name: parsed.data.businessName },
        },
        headers: requestHeaders,
      });
      await auth.api.setActiveOrganization({
        body: { organizationId: workspaceId },
        headers: requestHeaders,
      });
    } else {
      const created = await auth.api.createOrganization({
        body: {
          name: parsed.data.businessName,
          slug: workspaceSlug(
            parsed.data.businessName,
            randomBytes(3).toString("hex"),
          ),
        },
        headers: requestHeaders,
      });
      if (!created) throw new Error("Workspace was not created");
      workspaceId = created.id;
    }

    await saveWorkspaceProfile(workspaceId, parsed.data);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[workspace] set up failed", error);
    return {
      status: "error",
      message: "We couldn't save your workspace. Please try again.",
      values,
    };
  }

  redirect("/dashboard");
}

/** Settings: update the business details of the current workspace. */
export async function updateWorkspace(
  _prev: WorkspaceFormState,
  formData: FormData,
): Promise<WorkspaceFormState> {
  const { workspace } = await requireWorkspace();
  const values = readForm(formData);
  const parsed = workspaceDetailsSchema.safeParse(values);
  if (!parsed.success) return invalid(values, parsed.error.issues);

  try {
    if (parsed.data.businessName !== workspace.businessName) {
      await auth.api.updateOrganization({
        body: {
          organizationId: workspace.workspaceId,
          data: { name: parsed.data.businessName },
        },
        headers: await headers(),
      });
    }
    await saveWorkspaceProfile(workspace.workspaceId, parsed.data);
  } catch (error) {
    console.error("[workspace] update failed", error);
    return {
      status: "error",
      message: "Changes weren't saved. Please try again.",
      values,
    };
  }

  return { status: "saved", message: "Business details saved.", values };
}
