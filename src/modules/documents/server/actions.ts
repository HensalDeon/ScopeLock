"use server";

import { refresh } from "next/cache";
import { workspaceAction } from "@/modules/workspace/server";
import type { FormState } from "@/shared/lib/form-state";
import {
  PROPOSAL_DEFAULTS_FIELDS,
  proposalDefaultsSchema,
  type ProposalDefaultsField,
} from "../domain/defaults";
import {
  DOCUMENT_STYLE_FIELDS,
  documentStyleSchema,
  type DocumentStyleField,
} from "../domain/style";
import * as repo from "./repository";

export type DocumentStyleFormState = FormState<DocumentStyleField>;
export type ProposalDefaultsFormState = FormState<ProposalDefaultsField>;

/** How every client-facing document looks. Owners and admins only. */
export const updateDocumentStyle = workspaceAction(
  {
    fields: DOCUMENT_STYLE_FIELDS,
    schema: documentStyleSchema,
    roles: ["owner", "admin"],
    failureMessage: "The style wasn't saved. Please try again.",
  },
  async (style, { workspace }) => {
    await repo.saveDocumentStyle(workspace.workspaceId, style);
    refresh();
    return { message: "Document style saved." };
  },
);

/** Default terms, exclusions and client needs for new proposals. */
export const updateProposalDefaults = workspaceAction(
  {
    fields: PROPOSAL_DEFAULTS_FIELDS,
    schema: proposalDefaultsSchema,
    roles: ["owner", "admin"],
    failureMessage: "The defaults weren't saved. Please try again.",
  },
  async (defaults, { workspace }) => {
    await repo.saveProposalDefaults(workspace.workspaceId, defaults);
    refresh();
    return { message: "Defaults saved. New projects will start with these." };
  },
);
