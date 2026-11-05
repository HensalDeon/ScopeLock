import { ObjectId } from "mongodb";

/**
 * Parses an id from a URL or form. Returns null for anything that isn't a
 * 24-character hex ObjectId, so callers can answer with notFound() instead of
 * letting a bad id reach a query (or throw a 500).
 */
export function parseObjectId(raw: unknown): ObjectId | null {
  if (typeof raw !== "string" || !/^[0-9a-f]{24}$/i.test(raw)) return null;
  return new ObjectId(raw);
}
