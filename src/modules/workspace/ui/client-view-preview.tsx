import { formatINR, paise } from "@/shared/lib/money";
import { LogoMark } from "@/shared/ui/brand";
import { BusinessInitials } from "./business-initials";

/**
 * A miniature of the client approval page, so the person filling in their
 * business details can see exactly where those details end up.
 */
export function ClientViewPreview({ businessName }: { businessName: string }) {
  const name = businessName.trim() || "Your business";
  return (
    <figure className="grid gap-3">
      <figcaption className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
        What your client sees
      </figcaption>
      <div
        className="overflow-hidden rounded-xl border bg-background shadow-[0_1px_2px_rgba(11,18,32,0.04),0_12px_32px_-12px_rgba(11,18,32,0.12)]"
        aria-hidden
      >
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <BusinessInitials name={name} className="size-8 text-[12px]" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="text-[12px] text-muted-foreground">
              Change request for Rahul Mehta
            </p>
          </div>
        </div>
        <div className="grid gap-3 px-4 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm">
              <span className="mr-1.5 font-mono text-[11px] text-muted-foreground">
                CR-001
              </span>
              Blog section
            </p>
            <p className="text-sm font-medium tabular-nums">
              {formatINR(paise(1_200_000))}
            </p>
          </div>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Not part of the original 5-page agreement. Billed with the final
            milestone.
          </p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <span className="flex h-8 items-center justify-center rounded-md bg-primary text-[13px] font-medium text-primary-foreground">
              Approve
            </span>
            <span className="flex h-8 items-center justify-center rounded-md border text-[13px] font-medium">
              Decline
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 border-t bg-canvas py-2 text-[11px] text-muted-foreground">
          Powered by
          <LogoMark title="" className="size-3" />
          <span className="font-medium tracking-tight text-foreground">
            scopelock
          </span>
        </div>
      </div>
    </figure>
  );
}
