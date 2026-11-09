/**
 * Documents module: server-only API.
 */
import "server-only";

export {
  getDocumentImages,
  getDocumentSettings,
  getPortalDocumentSettings,
} from "./server/queries";
export type { DocumentSettings } from "./server/repository";
// Pure, but needed by server code that must not load the document UI.
export { termsForTax } from "./domain/defaults";
export { gstChangeNote } from "./domain/document-data";
