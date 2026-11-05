export function AuthHeading({
  title,
  description,
}: {
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-7 grid gap-2">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
        {title}
      </h1>
      {description && (
        <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

/** Stand-in while a form that reads the URL streams in. */
export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="grid gap-5" aria-hidden>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="grid gap-2">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-9 rounded-md bg-muted" />
        </div>
      ))}
      <div className="h-10 rounded-md bg-muted" />
    </div>
  );
}
