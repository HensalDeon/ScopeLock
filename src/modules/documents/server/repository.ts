import "server-only";
import { COLLECTIONS } from "@/shared/db/names";
import { scopedCollection, type WorkspaceOwned } from "@/shared/db/scoped";
import type { DocumentImageKind } from "../domain/images";
import {
  STARTER_PROPOSAL_DEFAULTS,
  type ProposalDefaults,
} from "../domain/defaults";
import { DEFAULT_DOCUMENT_STYLE, type DocumentStyle } from "../domain/style";

type DocumentSettingsDoc = WorkspaceOwned & {
  style?: DocumentStyle;
  defaults?: ProposalDefaults;
  /** R2 object keys (private bucket). */
  logoKey?: string | null;
  coverKey?: string | null;
};

export type DocumentSettings = {
  style: DocumentStyle;
  defaults: ProposalDefaults;
  images: { logoKey: string | null; coverKey: string | null };
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
    images: { logoKey: doc?.logoKey ?? null, coverKey: doc?.coverKey ?? null },
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

const FIELD: Record<DocumentImageKind, "logoKey" | "coverKey"> = {
  logo: "logoKey",
  cover: "coverKey",
};

/**
 * Points the workspace's logo or cover at a new object (or none) and returns
 * the key it replaced, so the caller can delete the old file.
 */
export async function setDocumentImage(
  workspaceId: string,
  kind: DocumentImageKind,
  key: string | null,
): Promise<string | null> {
  const field = FIELD[kind];
  const before = await settings(workspaceId).findOneAndUpdate(
    {},
    { $set: { [field]: key } },
    { upsert: true, returnDocument: "before" },
  );
  return before?.[field] ?? null;
}
