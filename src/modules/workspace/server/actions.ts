"use server";

import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { auth } from "@/shared/auth/server";
import {
  fieldErrorsFrom,
  readFields,
  type FormState,
} from "@/shared/lib/form-state";
import {
  WORKSPACE_FIELDS,
  workspaceDetailsSchema,
  workspaceSlug,
  type WorkspaceField,
} from "../domain/workspace";
import { workspaceAction } from "./action";
import { getOnboardingState } from "./context";
import { saveWorkspaceProfile } from "./repository";

export type WorkspaceFormState = FormState<WorkspaceField>;

/**
 * Onboarding: create the user's workspace and its profile. Not a
 * workspaceAction, because there's no workspace yet.
 */
export async function setUpWorkspace(
  _previous: WorkspaceFormState,
  formData: FormData,
): Promise<WorkspaceFormState> {
  const { workspaceId: existingId, isSetUp } = await getOnboardingState({
    fresh: true,
  });
  if (isSetUp) redirect("/dashboard");

  const values = readFields(formData, WORKSPACE_FIELDS);
  const parsed = workspaceDetailsSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: fieldErrorsFrom<WorkspaceField>(parsed.error.issues),
      values,
    };
  }

  const requestHeaders = await headers();
  try {
    let workspaceId = existingId;
    if (workspaceId) {
      // Re-use a workspace left half-finished by an earlier attempt.
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
      // createOrganization marks it active in the database only; this also
      // refreshes the session cookie, so the proxy sees it straight away.
      await auth.api.setActiveOrganization({
        body: { organizationId: workspaceId },
        headers: requestHeaders,
      });
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

/** Settings: update the business details clients see. Owners and admins only. */
export const updateWorkspace = workspaceAction(
  {
    fields: WORKSPACE_FIELDS,
    schema: workspaceDetailsSchema,
    roles: ["owner", "admin"],
    failureMessage: "Changes weren't saved. Please try again.",
  },
  async (details, { workspace }) => {
    if (details.businessName !== workspace.businessName) {
      await auth.api.updateOrganization({
        body: {
          organizationId: workspace.workspaceId,
          data: { name: details.businessName },
        },
        headers: await headers(),
      });
    }
    await saveWorkspaceProfile(workspace.workspaceId, details);
    // The sidebar shows the business name; re-render it.
    refresh();
    return { message: "Business details saved." };
  },
);
