/**
 * Documents module: public, client-safe API. Templates, document style and
 * default proposal text. Server-only settings queries are in ./server.ts.
 */
export {
  approvalAmount,
  gstChangeNote,
  type ChangeOrderData,
  type ProposalDocumentData,
} from "./domain/document-data";
export { NO_IMAGES, type DocumentImages } from "./domain/images";
export {
  defaultsToFormValues,
  PROPOSAL_DEFAULTS_FIELDS,
  proposalDefaultsSchema,
  STARTER_PROPOSAL_DEFAULTS,
  termsForTax,
  type ProposalDefaults,
} from "./domain/defaults";
export {
  ACCENT_PRESETS,
  COVER_STYLE_LABELS,
  COVER_STYLES,
  DEFAULT_DOCUMENT_STYLE,
  documentStyleSchema,
  styleToFormValues,
  type DocumentStyle,
} from "./domain/style";
export { sampleProposal } from "./domain/sample";
export type { DocumentAcceptance } from "./ui/acceptance-block";
export { ChangeOrderDocument } from "./ui/change-order-document";
export { ClassicDocument } from "./ui/classic-document";
export { ProposalDefaultsForm } from "./ui/defaults-form";
export { DocumentStyleEditor } from "./ui/style-editor";
