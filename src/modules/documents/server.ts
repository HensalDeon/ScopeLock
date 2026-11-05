/**
 * Documents module: server-only API.
 */
import "server-only";

export { getDocumentImages, getDocumentSettings } from "./server/queries";
export type { DocumentSettings } from "./server/repository";
