import { cn } from "@/shared/lib/utils";

/** Standard page width and gutters for signed-in screens. */
export function PageContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="grid min-w-0 gap-1">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
        {description && (
          <p className="max-w-prose text-[15px] text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        // Page actions are 44px tall on phones (TOUCH).
        <div className="flex gap-2 max-sm:*:h-11 max-sm:*:px-4">{actions}</div>
      )}
    </div>
  );
}

/** A titled settings-style section: label column on the left, content on the right. */
export function Section({
  id,
  title,
  description,
  children,
}: {
  /** An anchor to link straight to it ("#billing"). */
  id?: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="grid scroll-mt-20 gap-6 border-t py-8 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-10"
    >
      <div className="grid content-start gap-1">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** A page block with an h2, wired up with aria-labelledby. */
export function TitledSection({
  id,
  title,
  action,
  children,
}: {
  /** Unique on the page (pages stay mounted; include an entity id). */
  id: string;
  title: React.ReactNode;
  /** Shown at the right of the heading, e.g. a "New …" button. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={id} className="text-[15px] font-semibold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * A block of a long form: what it is on the left, the fields on the right
 * (stacked on phones). Used by the project and change request forms.
 */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:gap-10">
      <div className="grid content-start gap-1">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        <p className="text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
