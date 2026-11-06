import { Check } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

export type SetupStep = {
  title: string;
  detail: string;
  done: boolean;
  href?: Route;
};

/** First-run steps. Shown on the overview only until they're all done. */
export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const doneCount = steps.filter((s) => s.done).length;
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
                    href={step.href}
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
    </section>
  );
}
