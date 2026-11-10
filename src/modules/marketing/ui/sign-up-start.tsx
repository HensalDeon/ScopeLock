"use client";

import Form from "next/form";
import { useLayoutEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

/**
 * The page's one action, in its working form: type your email here and the
 * sign-up page opens with it filled in. Works without JavaScript; with it,
 * a half-typed address gets a plain message and the button says
 * "Opening sign-up…" while the next page loads.
 */

const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function SignUpStart({
  id,
  invert = false,
  className,
}: {
  /** Unique per page: the form appears more than once. */
  id: string;
  /** On the dark record band: white field and button. */
  invert?: boolean;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Visited pages stay mounted: coming back shows the form ready again.
  useLayoutEffect(() => () => setPending(false), []);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    if (email.trim() && !LOOKS_LIKE_EMAIL.test(email.trim())) {
      event.preventDefault();
      setError("Add the full address, like asha@studio.in.");
      return;
    }
    setError(null);
    setPending(true);
  }

  const errorId = `${id}-error`;
  return (
    <div className={cn("grid gap-3", className)}>
      <Form
        action="/sign-up"
        noValidate
        onSubmit={onSubmit}
        className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <label htmlFor={id} className="sr-only">
          Your email
        </label>
        <Input
          id={id}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@yourstudio.in"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={() => error && setError(null)}
          className={cn(
            "h-12 text-[15px] placeholder:text-muted-foreground sm:w-80 md:text-[15px]",
            invert && "border-white/30 bg-white text-foreground dark:bg-white",
          )}
        />
        <Button
          type="submit"
          size="lg"
          className={cn(
            "h-12 px-6 text-[15px]",
            invert && "bg-white text-foreground hover:bg-white/85",
          )}
        >
          {pending ? "Opening sign-up…" : "Create free account"}
        </Button>
      </Form>
      {error && (
        <p
          id={errorId}
          role="alert"
          className={cn(
            "text-sm",
            invert ? "text-[#fca5a5]" : "text-destructive",
          )}
        >
          {error}
        </p>
      )}
      <p
        className={cn(
          "text-sm",
          invert ? "text-[#a3adbd]" : "text-muted-foreground",
        )}
      >
        Free for 2 projects. No card needed.
      </p>
    </div>
  );
}
