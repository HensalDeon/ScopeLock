"use server";

import type { Route } from "next";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { workspaceAction } from "@/modules/workspace/server";
import { safeNextPath } from "@/shared/auth/redirect";
import { parseObjectId } from "@/shared/db/ids";
import { UserError, type FormState } from "@/shared/lib/form-state";
import {
  CLIENT_FIELDS,
  clientInputSchema,
  clientLabel,
  type ClientField,
} from "../domain/client";
import * as repo from "./repository";

export type ClientFormState = FormState<ClientField | "id" | "next">;

const objectIdField = z.string().transform((value, ctx) => {
  const id = parseObjectId(value);
  if (!id) {
    ctx.addIssue({ code: "custom", message: "This client doesn't exist." });
    return z.NEVER;
  }
  return id;
});

const NOT_FOUND = "This client doesn't exist any more. Refresh the page.";

/**
 * Add a client. Goes to the client's page, or back to where the person came
 * from (e.g. "New project"), with the new client selected.
 */
export const createClient = workspaceAction(
  {
    fields: [...CLIENT_FIELDS, "next"],
    schema: clientInputSchema.extend({ next: z.string() }),
    failureMessage: "The client wasn't saved. Please try again.",
  },
  async ({ next, ...input }, { workspace }) => {
    const id = await repo.insertClient(workspace.workspaceId, input);
    if (next) {
      const back = new URL(safeNextPath(next, "/clients"), "http://x");
      back.searchParams.set("client", id);
      // safeNextPath keeps this on our own site.
      redirect(`${back.pathname}${back.search}` as Route);
    }
    redirect(`/clients/${id}`);
  },
);

/**
 * Add a client without leaving the current form (e.g. inside New project).
 * Returns the new id and its label instead of redirecting.
 */
export const quickAddClient = workspaceAction(
  {
    fields: CLIENT_FIELDS,
    schema: clientInputSchema,
    failureMessage: "The client wasn't saved. Please try again.",
  },
  async (input, { workspace }) => {
    const id = await repo.insertClient(workspace.workspaceId, input);
    return { id, message: clientLabel(input) };
  },
);

export const updateClient = workspaceAction(
  {
    fields: [...CLIENT_FIELDS, "id"],
    schema: clientInputSchema.extend({ id: objectIdField }),
    failureMessage: "Changes weren't saved. Please try again.",
  },
  async ({ id, ...input }, { workspace }) => {
    const found = await repo.updateClient(workspace.workspaceId, id, input);
    if (!found) throw new UserError(NOT_FOUND);
    refresh();
    return { message: "Client details saved." };
  },
);

const archiveSchema = z.object({
  id: objectIdField,
  archived: z.enum(["true", "false"]).transform((v) => v === "true"),
});

/** Archive hides a client from lists and pickers; restore brings it back. */
export const setClientArchived = workspaceAction(
  {
    fields: ["id", "archived"],
    schema: archiveSchema,
    failureMessage: "That didn't work. Please try again.",
  },
  async ({ id, archived }, { workspace }) => {
    const found = await repo.setClientArchived(
      workspace.workspaceId,
      id,
      archived,
    );
    if (!found) throw new UserError(NOT_FOUND);
    refresh();
    return {
      message: archived ? "Client archived." : "Client restored.",
    };
  },
);
