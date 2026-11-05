import { LogoMark } from "@/shared/ui/brand";

/**
 * Layout for 404 and error screens: the mark, a plain heading, what happened,
 * and what to do next. No illustrations, no jokes.
 */
export function StatusPage({
  code,
  title,
  children,
  actions,
}: {
  code: string;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center bg-background px-5 py-16">
      <div className="mx-auto grid w-full max-w-md gap-6">
        <LogoMark className="size-9" />
        <div className="grid gap-3">
          <p className="font-mono text-[11.5px] tracking-[0.14em] text-muted-foreground uppercase">
            {code}
          </p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
            {title}
          </h1>
          <div className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
            {children}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">{actions}</div>
      </div>
    </main>
  );
}
