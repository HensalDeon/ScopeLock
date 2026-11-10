import Form from "next/form";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

/**
 * The page's one action, in its working form: type your email here and the
 * sign-up page opens with it filled in. Works without JavaScript.
 */
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
  return (
    <div className={cn("grid gap-3", className)}>
      <Form
        action="/sign-up"
        className="flex flex-col gap-2.5 sm:flex-row sm:items-center"
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
          Create free account
        </Button>
      </Form>
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
