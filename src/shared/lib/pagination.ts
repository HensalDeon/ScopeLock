/**
 * Page-number pagination for list pages (?page=2). Workspace lists are small
 * enough that skip/limit with a count is simple and correct; every list page
 * uses these helpers and the shared <Pagination> so they behave the same.
 */
export const PAGE_SIZE = 20;

export type Page<T> = {
  items: T[];
  /** 1-based, already clamped to the last page. */
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

/** "?page=3" → 3. Anything else (missing, 0, "abc", arrays) → 1. */
export function parsePage(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !/^\d{1,6}$/.test(raw)) return 1;
  return Math.max(1, Number(raw));
}

/** The page to show for `total` items: never past the last page. */
export function clampPage(
  page: number,
  total: number,
  pageSize = PAGE_SIZE,
): number {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(Math.max(1, page), pageCount);
}

/** skip/limit for a (clamped) page. */
export function pageWindow(
  page: number,
  pageSize = PAGE_SIZE,
): { skip: number; limit: number } {
  return { skip: (page - 1) * pageSize, limit: pageSize };
}

export function toPage<T>(
  items: T[],
  total: number,
  page: number,
  pageSize = PAGE_SIZE,
): Page<T> {
  return {
    items,
    page,
    pageSize,
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Loads one page: counts, clamps the page (so ?page=99 shows the last
 * page, not an empty list), then fetches that window.
 */
export async function paginate<T>(
  requested: number,
  count: () => Promise<number>,
  fetch: (window: { skip: number; limit: number }) => Promise<T[]>,
  pageSize = PAGE_SIZE,
): Promise<Page<T>> {
  const total = await count();
  const page = clampPage(requested, total, pageSize);
  const items = total === 0 ? [] : await fetch(pageWindow(page, pageSize));
  return toPage(items, total, page, pageSize);
}
