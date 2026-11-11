"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { clientFirstName } from "@/modules/clients";
import { workspaceAction } from "@/modules/workspace/server";
import { parseObjectId } from "@/shared/db/ids";
import { UserError, type FormState } from "@/shared/lib/form-state";
import { archiveBlocker } from "../domain/archive";
import { projectLimitMessage } from "./limits";
import { getProjectOrNotFound } from "./queries";
import * as repo from "./repository";

export type ArchiveFormState = FormState<"id" | "archived">;

const schema = z.object({
  id: z.string().transform((v, ctx) => {
    const id = parseObjectId(v);
    if (!id) {
      ctx.addIssue({ code: "custom", message: "This project doesn't exist." });
      return z.NEVER;
    }
    return id;
  }),
  archived: z.enum(["true", "false"]).transform((v) => v === "true"),
});

/**
 * Archive a finished project (read-only, not counted towards the plan) or
 * restore it (counts again, so the plan needs room for it).
 */
export const setProjectArchived = workspaceAction(
  {
    fields: ["id", "archived"],
    schema,
    failureMessage: "That didn't save. Please try again.",
  },
  async ({ id, archived }, { workspace }) => {
    const ws = workspace.workspaceId;
    const project = await getProjectOrNotFound(id.toHexString());
    if (archived) {
      const blocker = archiveBlocker(
        project,
        project.client ? clientFirstName(project.client) : "your client",
      );
      if (blocker) throw new UserError(blocker.reason);
    } else {
      const full = await projectLimitMessage(ws, "restore this one");
      if (full) throw new UserError(full);
    }
    const done = await repo.setProjectArchived(ws, id, archived);
    if (!done)
      throw new UserError(
        "Something changed on this project meanwhile. Refresh the page and try again.",
      );
    refresh();
    return {
      message: archived
        ? "Archived. It no longer counts towards your plan."
        : "Restored. It counts towards your plan again.",
    };
  },
);
