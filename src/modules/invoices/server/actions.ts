"use server";

import { refresh } from "next/cache";
import { workspaceAction } from "@/modules/workspace/server";
import type { FormState } from "@/shared/lib/form-state";
import { financialYear } from "@/shared/lib/india";
import {
  INVOICING_FIELDS,
  invoicingInputSchema,
  toInvoicingSettings,
  type InvoicingField,
} from "../domain/invoice";
import * as repo from "./repository";

export type InvoicingFormState = FormState<InvoicingField>;

export const updateInvoicing = workspaceAction(
  {
    fields: INVOICING_FIELDS,
    schema: invoicingInputSchema,
    roles: ["owner", "admin"],
    failureMessage: "Invoice details weren't saved. Please try again.",
  },
  async (input, { workspace }) => {
    await repo.saveInvoicing(
      workspace.workspaceId,
      toInvoicingSettings(input),
      financialYear(new Date()).key,
    );
    refresh();
    return { message: "Invoice details saved." };
  },
);
