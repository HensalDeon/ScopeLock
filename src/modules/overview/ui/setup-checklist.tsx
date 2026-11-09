import { Check, ChevronDown } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";
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
              · {doneCount} of {steps.length} done
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
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
  return (
    <ol className="divide-y">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-4 px-5 py-4">
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
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-medium",
                step.done && "text-muted-foreground",
              )}
            >
              {step.href && !step.done ? (
                <Link
                  href={step.href as Route}
                  className="underline-offset-4 hover:underline"
                >
                  {step.title}
                </Link>
              ) : (
                step.title
              )}
              <span className="sr-only">
                {step.done ? " (done)" : " (to do)"}
              </span>
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {step.detail}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
