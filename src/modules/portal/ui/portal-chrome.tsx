import { LogoMark } from "@/shared/ui/brand";

/** Shared pieces of the client's portal pages. */
export function PortalHeader({
  title,
  detail,
  back,
  children,
}: {
  title: string;
  detail: string;
  back?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {back}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="truncate text-xs text-muted-foreground tabular-nums">
              {detail}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </header>
  );
}

export function StatusStrip({
  tone,
  children,
}: {
  tone: "done" | "waiting" | "neutral";
  children: React.ReactNode;
}) {
  const styles = {
    done: "border-brand/25 bg-success-soft text-foreground",
    waiting: "border-warning/30 bg-warning-soft text-warning-ink",
    neutral: "border-black/10 bg-white text-foreground",
  }[tone];
  return (
    <div role="status" className={`border-b print:hidden ${styles}`}>
      <p className="mx-auto max-w-[210mm] px-4 py-3 text-sm font-medium text-pretty">
        {children}
      </p>
    </div>
  );
}

export function Notice({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center px-5 py-16">
      <div className="mx-auto grid w-full max-w-md gap-3 rounded-lg border bg-white p-6">
        <h1 className="text-lg font-semibold text-balance">{title}</h1>
        <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {children}
        </p>
        {action}
      </div>
    </main>
  );
}

export function Footer() {
  return (
    <footer className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-[#4f535b] print:hidden">
      <LogoMark className="size-3.5" />
      Sent with ScopeLock
    </footer>
  );
}
