import { Check, ChevronDown, ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { LinkChevron } from "@/shared/ui/link-pending";
import { TOUCH } from "@/shared/ui/touch";
import type { SetupStep } from "../domain/setup";
import { SetupVisibility } from "./setup-visibility";

/**
 * First-run steps, shown until they're all done. `folded`: once work is
 * approved the steps sit closed under the lists, one line until opened.
 */
export function SetupChecklist({
  steps,
  folded = false,
}: {
  steps: SetupStep[];
  folded?: boolean;
}) {
  const doneCount = steps.filter((s) => s.done).length;
  if (folded) {
    return (
      <details className="group rounded-xl border bg-background">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-sm [&::-webkit-details-marker]:hidden">
          <span>
            <span className="font-medium">Getting set up</span>
            <span className="text-muted-foreground tabular-nums">
              {" "}
              · {steps.length - doneCount} left:{" "}
              {steps
                .filter((s) => !s.done)
                .map((s) => s.short)
                .join(", ")}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-muted-foreground">
            <span className="group-open:hidden">Show steps</span>
            <span className="hidden group-open:inline">Hide steps</span>
            <ChevronDown
              aria-hidden
              className="size-4 transition-transform group-open:rotate-180"
            />
          </span>
        </summary>
        <div className="border-t">
          <Steps steps={steps} />
          <div className="border-t px-3 py-1">
            <SetupVisibility hide label="Hide these steps" />
          </div>
        </div>
      </details>
    );
  }
  return (
    <section
      aria-labelledby="setup-title"
      className="rounded-xl border bg-background"
    >
      <div className="flex items-baseline justify-between gap-4 border-b px-5 py-4">
        <h2 id="setup-title" className="font-semibold">
          Getting set up
        </h2>
        <p className="text-sm text-muted-foreground tabular-nums">
          {doneCount} of {steps.length} done
        </p>
      </div>
      <Steps steps={steps} />
      <div className="border-t px-3 py-1">
        <SetupVisibility hide label="Hide these steps" />
      </div>
    </section>
  );
}

function Steps({ steps }: { steps: SetupStep[] }) {
  // The first open step with a page to go to is the one to do next.
  const next = steps.findIndex((s) => !s.done && s.href);
  return (
    <ol className="divide-y">
      {steps.map((step, index) => {
        const open = !step.done && step.href;
        const body = (
          <>
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums",
                step.done
                  ? "border-brand bg-brand text-white"
                  : "bg-background text-muted-foreground",
              )}
            >
              {step.done ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span
                className={cn(
                  "text-sm font-medium",
                  step.done && "text-muted-foreground",
                  open &&
                    index !== next &&
                    "underline-offset-4 group-hover:underline",
                )}
              >
                {step.title}
                <span className="sr-only">
                  {step.done ? " (done)" : " (to do)"}
                </span>
              </span>
              <span className="text-sm text-muted-foreground">
                {step.detail}
              </span>
            </span>
          </>
        );
        if (index === next)
          return (
            <li
              key={step.title}
              className="grid gap-3 bg-canvas px-5 py-4 sm:flex sm:items-center sm:gap-4"
            >
              <span className="flex flex-1 gap-4">{body}</span>
              <Button asChild className={cn("sm:shrink-0", TOUCH)}>
                <Link href={step.href as Route}>
                  {step.action ?? "Start"}
                  <ChevronRight aria-hidden />
                </Link>
              </Button>
            </li>
          );
        return (
          <li key={step.title}>
            {open ? (
              <Link
                href={step.href as Route}
                className="group flex gap-4 px-5 py-4 transition-colors hover:bg-canvas"
              >
                {body}
                <LinkChevron className="mt-0.5" />
              </Link>
            ) : (
              <div className="flex gap-4 px-5 py-4">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
