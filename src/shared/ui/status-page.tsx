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
  inApp = false,
}: {
  code: string;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
  /** Inside the app's own <main> (and its shell): no second <main>. */
  inApp?: boolean;
}) {
  const Wrapper = inApp ? "div" : "main";
  return (
    <Wrapper
      className={
        inApp
          ? "flex items-center px-5 py-16 sm:py-24"
          : "flex min-h-dvh items-center bg-background px-5 py-16"
      }
    >
      <div className="mx-auto grid w-full max-w-md gap-6">
        <LogoMark className="size-9" />
        <div className="grid gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
            {title}
          </h1>
          <div className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
            {children}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">{actions}</div>
        <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
          Error {code}
        </p>
      </div>
    </Wrapper>
  );
}
