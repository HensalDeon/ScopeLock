/**
 * The same page for every link that doesn't open (mistyped, replaced or
 * never existed), so it never reveals which.
 */
export default function PortalNotFound() {
  return (
    <main className="flex min-h-dvh items-center px-5 py-16">
      <div className="mx-auto grid w-full max-w-md gap-3 rounded-lg border bg-white p-6">
        <h1 className="text-lg font-semibold text-balance">
          This link doesn&apos;t open
        </h1>
        <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">
          It may have been replaced with a new one, or copied only in part. Ask
          the person who sent it for the latest link.
        </p>
      </div>
    </main>
  );
}
