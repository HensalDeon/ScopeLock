import { ChevronRight, MessageCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export type AttentionItem = {
  key: string;
  /** "Proposal", "CR-002", "Draft"… */
  tag: string;
  tone: "waiting" | "neutral";
  title: string;
  /** Project · client · when. */
  detail: string;
  amount: string;
  href: Route;
  /** A client note to show under the row. */
  quote?: string | null;
  /** WhatsApp reminder link, for things waiting on the client. */
  remind?: string | null;
};

/** A titled list of things to act on, with a real empty state. */
export function AttentionList({
  id,
  title,
  description,
  items,
  empty,
}: {
  id: string;
  title: string;
  description: string;
  items: AttentionItem[];
  empty: string;
}) {
  return (
    <section aria-labelledby={id} className="grid gap-3">
      <div className="grid gap-0.5">
        <h2 id={id} className="text-[15px] font-semibold">
          {title}
          {items.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
              {items.length}
            </span>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed px-5 py-4 text-sm text-pretty text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-background">
          {items.map((item) => (
            <li
              key={item.key}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5"
            >
              <Link href={item.href} className="group grid min-w-0 gap-0.5">
                <span
                  className={cn(
                    "font-mono text-[11px] tracking-[0.1em] uppercase",
                    item.tone === "waiting"
                      ? "text-warning-ink"
                      : "text-muted-foreground",
                  )}
                >
                  {item.tag}
                </span>
                <span className="flex items-center gap-1 text-sm font-medium">
                  <span className="truncate group-hover:underline group-hover:underline-offset-4">
                    {item.title}
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="size-3.5 shrink-0 text-muted-foreground"
                  />
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {item.detail}
                </span>
              </Link>
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm font-semibold tabular-nums">
                  {item.amount}
                </span>
                {item.remind && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={item.remind}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle aria-hidden />
                      Remind
                    </a>
                  </Button>
                )}
              </div>
              {item.quote && (
                <p className="col-span-full border-l-2 border-warning pl-3 text-sm leading-relaxed text-pretty whitespace-pre-line">
                  {item.quote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
