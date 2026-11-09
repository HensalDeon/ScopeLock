/** The project page while it loads. */
export function ProjectSkeleton() {
  return (
    <div aria-hidden className="grid gap-8">
      <div className="grid gap-3">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="h-7 w-64 rounded bg-muted" />
        <div className="h-4 w-40 rounded bg-muted/70" />
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="h-72 rounded-xl border bg-background" />
        <div className="h-44 rounded-xl border bg-canvas" />
      </div>
    </div>
  );
}
