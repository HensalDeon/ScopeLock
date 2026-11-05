import "server-only";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection, type WorkspaceOwned } from "@/shared/db/scoped";
import {
  STARTER_PROPOSAL_DEFAULTS,
  type ProposalDefaults,
} from "../domain/defaults";
import { DEFAULT_DOCUMENT_STYLE, type DocumentStyle } from "../domain/style";

type DocumentSettingsDoc = WorkspaceOwned & {
  style?: DocumentStyle;
  defaults?: ProposalDefaults;
};

export type DocumentSettings = {
  style: DocumentStyle;
  defaults: ProposalDefaults;
};

const settings = (workspaceId: string) =>
  scopedCollection<DocumentSettingsDoc>(
    COLLECTIONS.documentSettings,
    workspaceId,
  );

/** Saved settings, falling back to the defaults for anything not saved yet. */
export async function findDocumentSettings(
  workspaceId: string,
): Promise<DocumentSettings> {
  const doc = await settings(workspaceId).findOne();
  return {
    style: { ...DEFAULT_DOCUMENT_STYLE, ...doc?.style },
    defaults: { ...STARTER_PROPOSAL_DEFAULTS, ...doc?.defaults },
  };
}

export async function saveDocumentStyle(
  workspaceId: string,
  style: DocumentStyle,
): Promise<void> {
  await settings(workspaceId).updateOne(
    {},
    { $set: { style } },
    { upsert: true },
  );
}

export async function saveProposalDefaults(
  workspaceId: string,
  defaults: ProposalDefaults,
): Promise<void> {
  await settings(workspaceId).updateOne(
    {},
    { $set: { defaults } },
    { upsert: true },
  );
}
