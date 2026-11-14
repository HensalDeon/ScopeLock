import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import {
  fieldErrorsFrom,
  readFields,
  UserError,
  type FormState,
} from "@/shared/lib/form-state";
import { requireAdmin, type AdminContext } from "./access";

type ActionSuccess = { message?: string; id?: string };

/**
 * A form server action for platform admins, as strict as workspaceAction:
 * re-checks the admin against the database, reads only the declared fields,
 * validates them with Zod, and turns a UserError into its message (anything
 * else is logged and replaced with a plain one).
 */
export function adminAction<Field extends string, Schema extends z.ZodType>(
  config: { fields: readonly Field[]; schema: Schema },
  handler: (
    input: z.output<Schema>,
    admin: AdminContext,
  ) => Promise<ActionSuccess | void>,
) {
  return async function action(
    _previous: FormState<Field>,
    formData: FormData,
  ): Promise<FormState<Field>> {
    const admin = await requireAdmin();
    const values = readFields(formData, config.fields);
    const parsed = config.schema.safeParse(values);
    if (!parsed.success)
      return {
        status: "error",
        fieldErrors: fieldErrorsFrom<Field>(parsed.error.issues),
        message: "Check the highlighted fields.",
        values,
      };
    try {
      const result = await handler(parsed.data, admin);
      return { status: "success", values, ...result };
    } catch (error) {
      unstable_rethrow(error);
      if (error instanceof UserError)
        return { status: "error", message: error.message, values };
      console.error("[admin action] failed", error);
      return {
        status: "error",
        message: "That didn't save. Please try again.",
        values,
      };
    }
  };
}
