"use client";

import { Search } from "lucide-react";
import type { Route } from "next";
import Form from "next/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { parseSearch, SEARCH_MAX_LENGTH } from "@/shared/lib/search";
import { Button } from "./button";
import { Input } from "./input";
import { TOUCH, TOUCH_LINK } from "./touch";

/**
 * A list's search: a GET form (`?q=`), so results are a normal page that
 * can be bookmarked, paged and shared, and work without JavaScript. With
 * JavaScript it updates the list in place (no full reload), does nothing
 * when the search hasn't changed, and an emptied box clears the search.
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
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const current = parseSearch(value) ?? "";
  const href = (q: string) => {
    const params = new URLSearchParams(hidden);
    if (q) params.set("q", q);
    const query = params.toString();
    return (query ? `${action}?${query}` : action) as Route;
  };

  return (
    <Form
      role="search"
      action={action}
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const q = parseSearch(input.current?.value) ?? "";
        if (q === current) {
          if (!q) input.current?.focus();
          return;
        }
        startTransition(() => router.push(href(q), { scroll: false }));
      }}
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
          // A new search (or Clear) resets the box to what's shown.
          key={current}
          ref={input}
          type="search"
          name="q"
          defaultValue={current}
          aria-label={label}
          placeholder={placeholder}
          maxLength={SEARCH_MAX_LENGTH}
          className="pl-8"
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        className={TOUCH}
        aria-disabled={pending}
      >
        {pending ? "Searching…" : "Search"}
      </Button>
      {current && (
        <Link
          href={href("")}
          scroll={false}
          className={`text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline ${TOUCH_LINK}`}
        >
          Clear
        </Link>
      )}
    </Form>
  );
}
