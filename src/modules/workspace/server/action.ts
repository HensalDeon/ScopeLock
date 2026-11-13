import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import type { WorkspaceRole } from "@/shared/auth/membership";
import {
  fieldErrorsFrom,
  readFields,
  UserError,
  type FormState,
} from "@/shared/lib/form-state";
import { requireWorkspaceForWrite, type WorkspaceContext } from "./context";

type ActionConfig<Field extends string, Schema extends z.ZodType> = {
  /** Form fields to read. Anything else in the FormData is ignored. */
  fields: readonly Field[];
  schema: Schema;
  /** Who may run it. Defaults to every member of the workspace. */
  roles?: readonly WorkspaceRole[];
  /** Shown when something unexpected fails (the error itself is logged). */
  failureMessage?: string;
};

type ActionSuccess = { message?: string; id?: string };

/**
 * Builds a form server action for a workspace. Every call, in order:
 * 1. re-checks the session against the database (not the cookie cache)
 * 2. resolves the workspace and checks membership + role
 * 3. reads only the declared fields and validates them with Zod
 * 4. runs the handler; a UserError's message is shown, anything else is
 *    logged and replaced with `failureMessage`
 *
 * redirect() and notFound() inside the handler work as usual.
 *
 * Use it in a "use server" file:
 *   export const createClient = workspaceAction(
 *     { fields: CLIENT_FIELDS, schema: clientInputSchema },
 *     async (input, { workspace }) => { ... return { message: "Client added." } },
 *   );
 */
export function workspaceAction<Field extends string, Schema extends z.ZodType>(
  config: ActionConfig<Field, Schema>,
  handler: (
    input: z.output<Schema>,
    context: WorkspaceContext,
  ) => Promise<ActionSuccess | void>,
) {
  return async function action(
    _previous: FormState<Field>,
    formData: FormData,
  ): Promise<FormState<Field>> {
    const context = await requireWorkspaceForWrite();
    const values = readFields(formData, config.fields);

    if (config.roles && !config.roles.includes(context.role)) {
      return {
        status: "error",
        message: config.roles.includes("admin")
          ? "Only the workspace owner or an admin can change this. Ask them to make the change."
          : "Only the workspace owner can change this. Ask them to make the change.",
        values,
      };
    }

    const parsed = config.schema.safeParse(values);
    if (!parsed.success) {
      return {
        status: "error",
        fieldErrors: fieldErrorsFrom<Field>(parsed.error.issues),
        values,
      };
    }

    try {
      const result = await handler(parsed.data, context);
      return { status: "success", values, ...result };
    } catch (error) {
      unstable_rethrow(error);
      if (error instanceof UserError) {
        return { status: "error", message: error.message, values };
      }
      console.error("[workspace action] failed", error);
      return {
        status: "error",
        message: config.failureMessage ?? "That didn't save. Please try again.",
        values,
      };
    }
  };
}
