import { ChevronRight, MessageCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { EmailReminderButton } from "@/modules/reminders";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import type { AttentionItem } from "../domain/overview";

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
        {/* Empty: the empty state says it; don't say it twice. */}
        {items.length > 0 && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
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
              <Link
                href={item.href as Route}
                className="group grid min-w-0 gap-0.5"
              >
                {/* Tags stay neutral; a waiting item gets the amber dot. */}
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                  {item.tone === "waiting" && (
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full bg-warning"
                    />
                  )}
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
                <span className="line-clamp-2 text-sm text-pretty text-muted-foreground">
                  {item.detail}
                </span>
              </Link>
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm font-semibold tabular-nums">
                  {item.amount}
                </span>
                {item.action && (
                  <Button asChild variant="outline" size="sm" className={TOUCH}>
                    <Link href={item.action.href as Route}>
                      {item.action.label}
                    </Link>
                  </Button>
                )}
                {item.email && (
                  <EmailReminderButton
                    projectId={item.email.projectId}
                    kind={item.email.kind}
                    refId={item.email.ref}
                    sentLabel={item.email.sentLabel}
                  />
                )}
                {item.remind && (
                  <Button asChild variant="outline" size="sm" className={TOUCH}>
                    <a
                      href={item.remind}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle aria-hidden />
                      {item.remindLabel ?? "Remind"}
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
