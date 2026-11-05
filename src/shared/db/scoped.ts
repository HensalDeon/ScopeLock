import "server-only";
import type {
  AggregateOptions,
  CountDocumentsOptions,
  DeleteOptions,
  Document,
  Filter,
  FindOneAndUpdateOptions,
  FindOptions,
  InsertOneOptions,
  OptionalUnlessRequiredId,
  UpdateFilter,
  UpdateOptions,
} from "mongodb";
import { collection } from "./collections";
import type { CollectionName } from "./names";

/** Fields every workspace-owned business document carries. */
export type WorkspaceOwned = {
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
};

/** A new document as callers write it: the scoped collection fills these in. */
export type NewDocument<T extends WorkspaceOwned> = Omit<
  OptionalUnlessRequiredId<T>,
  keyof WorkspaceOwned
>;

/**
 * The only way module code reads or writes business data.
 *
 * Every operation is pinned to one workspace: filters always get
 * `workspaceId` (set last, so a caller's filter can't override it), inserts
 * get it stamped on, and timestamps are maintained. A query that forgets the
 * workspace can't be written, because the raw collection isn't exposed.
 *
 * Public lookups that are not workspace-scoped by nature (a client opening a
 * portal link by token hash) go through a dedicated, reviewed repository
 * function instead.
 */
export function scopedCollection<T extends WorkspaceOwned & Document>(
  name: CollectionName,
  workspaceId: string,
) {
  if (!workspaceId) {
    throw new Error(`scopedCollection("${name}") needs a workspaceId`);
  }
  const raw = collection<T>(name);

  const scope = (filter: Filter<T> = {}): Filter<T> =>
    ({ ...filter, workspaceId }) as Filter<T>;

  const stamp = (
    update: UpdateFilter<T>,
    upsert: boolean | undefined,
  ): UpdateFilter<T> => {
    const now = new Date();
    return {
      ...update,
      $set: { ...update.$set, updatedAt: now },
      ...(upsert
        ? { $setOnInsert: { ...update.$setOnInsert, createdAt: now } }
        : {}),
    } as UpdateFilter<T>;
  };

  return {
    workspaceId,

    find: (filter?: Filter<T>, options?: FindOptions) =>
      raw.find(scope(filter), options),

    findOne: (filter?: Filter<T>, options?: FindOptions) =>
      raw.findOne(scope(filter), options),

    countDocuments: (filter?: Filter<T>, options?: CountDocumentsOptions) =>
      raw.countDocuments(scope(filter), options),

    insertOne: (doc: NewDocument<T>, options?: InsertOneOptions) => {
      const now = new Date();
      return raw.insertOne(
        {
          ...doc,
          workspaceId,
          createdAt: now,
          updatedAt: now,
        } as OptionalUnlessRequiredId<T>,
        options,
      );
    },

    updateOne: (
      filter: Filter<T>,
      update: UpdateFilter<T>,
      options?: UpdateOptions,
    ) => raw.updateOne(scope(filter), stamp(update, options?.upsert), options),

    /** Atomic read-modify-write, e.g. `{ status: "sent" }` → `"approved"`. */
    findOneAndUpdate: (
      filter: Filter<T>,
      update: UpdateFilter<T>,
      options: FindOneAndUpdateOptions = {},
    ) =>
      raw.findOneAndUpdate(
        scope(filter),
        stamp(update, options.upsert),
        options,
      ),

    deleteOne: (filter: Filter<T>, options?: DeleteOptions) =>
      raw.deleteOne(scope(filter), options),

    aggregate: (pipeline: Document[], options?: AggregateOptions) =>
      raw.aggregate([{ $match: { workspaceId } }, ...pipeline], options),
  };
}

export type ScopedCollection<T extends WorkspaceOwned & Document> = ReturnType<
  typeof scopedCollection<T>
>;
