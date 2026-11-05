import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/** Inline message at the top of a form. Announced to screen readers. */
export function FormAlert({
  tone = "error",
  children,
  className,
}: {
  tone?: "error" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-2.5 rounded-md border px-3 py-2.5 text-sm leading-snug",
        tone === "error"
          ? "border-destructive/25 bg-destructive/5 text-destructive"
          : "border-brand/25 bg-success-soft text-foreground",
        className,
      )}
    >
      <Icon
        className={cn(
          "mt-px size-4 shrink-0",
          tone === "success" && "text-brand",
        )}
        aria-hidden
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
