import { Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { SEARCH_MAX_LENGTH } from "@/shared/lib/search";
import { Button } from "./button";
import { Input } from "./input";
import { TOUCH, TOUCH_LINK } from "./touch";

/**
 * A list's search: a plain GET form (`?q=`), so results are a normal page
 * that can be bookmarked, paged and shared, and work without JavaScript.
 */
export function SearchBox({
  action,
  value,
  label,
  placeholder,
  hidden = {},
}: {
  /** The list's own path ("/clients"). */
  action: Route;
  /** The current search, if any. */
  value: string | null;
  /** What's searched, for screen readers ("Search clients"). */
  label: string;
  placeholder: string;
  /** Other query values to keep ("view=archived"). */
  hidden?: Record<string, string>;
}) {
  return (
    <form
      role="search"
      action={action}
      className="flex flex-wrap items-center gap-2"
    >
      {Object.entries(hidden).map(([name, v]) => (
        <input key={name} type="hidden" name={name} value={v} />
      ))}
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          name="q"
          defaultValue={value ?? ""}
          aria-label={label}
          placeholder={placeholder}
          maxLength={SEARCH_MAX_LENGTH}
          className="pl-8"
        />
      </div>
      <Button type="submit" variant="outline" className={TOUCH}>
        Search
      </Button>
      {value && (
        <Link
          href={
            (Object.keys(hidden).length
              ? `${action}?${new URLSearchParams(hidden)}`
              : action) as Route
          }
          className={`text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline ${TOUCH_LINK}`}
        >
          Clear
        </Link>
      )}
    </form>
  );
}
