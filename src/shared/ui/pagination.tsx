import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { Page } from "@/shared/lib/pagination";

/**
 * "Showing 21–40 of 57 projects" with Previous / Next. Renders nothing when
 * everything fits on one page.
 */
export function Pagination({
  page,
  noun,
  href,
}: {
  page: Pick<Page<unknown>, "page" | "pageSize" | "total" | "pageCount">;
  /** Plural, e.g. "projects". */
  noun: string;
  /** The URL for a page number (keeps the list's other filters). */
  href: (page: number) => Route;
}) {
  if (page.pageCount <= 1) return null;
  const from = (page.page - 1) * page.pageSize + 1;
  const to = Math.min(page.page * page.pageSize, page.total);
  const step =
    "inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-sm font-medium";
  return (
    <nav
      aria-label={`${noun} pages`}
      className="flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <p className="text-muted-foreground tabular-nums">
        Showing {from}–{to} of {page.total} {noun}
      </p>
      <div className="flex items-center gap-2">
        {page.page > 1 ? (
          <Link
            href={href(page.page - 1)}
            className={`${step} hover:bg-muted`}
            rel="prev"
          >
            <ChevronLeft aria-hidden className="size-4" />
            Previous
          </Link>
        ) : (
          <span
            aria-disabled
            className={`${step} text-muted-foreground opacity-50`}
          >
            <ChevronLeft aria-hidden className="size-4" />
            Previous
          </span>
        )}
        <span className="px-1 text-muted-foreground tabular-nums">
          Page {page.page} of {page.pageCount}
        </span>
        {page.page < page.pageCount ? (
          <Link
            href={href(page.page + 1)}
            className={`${step} hover:bg-muted`}
            rel="next"
          >
            Next
            <ChevronRight aria-hidden className="size-4" />
          </Link>
        ) : (
          <span
            aria-disabled
            className={`${step} text-muted-foreground opacity-50`}
          >
            Next
            <ChevronRight aria-hidden className="size-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
