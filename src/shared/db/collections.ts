import "server-only";
import type { Collection, Document } from "mongodb";
import { db } from "./client";

import { type CollectionName } from "./names";

export { COLLECTIONS, type CollectionName } from "./names";

export function collection<T extends Document>(
  name: CollectionName,
): Collection<T> {
  return db().collection<T>(name);
}
