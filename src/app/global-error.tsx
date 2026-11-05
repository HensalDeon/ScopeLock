"use client";

import "./globals.css";

/**
 * Last-resort screen when the root layout itself fails. It replaces the whole
 * document, so it brings its own <html>, <body> and styles.
 */
export default function GlobalError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="en-IN">
      <body className="font-sans antialiased">
        <title>Something went wrong · ScopeLock</title>
        <main className="flex min-h-dvh items-center bg-background px-5 py-16">
          <div className="mx-auto grid w-full max-w-md gap-4">
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">
              ScopeLock couldn&apos;t load
            </h1>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Nothing you saved has been lost. Reload to try again. If it keeps
              happening, it&apos;s on our side and we&apos;re likely already on
              it.
            </p>
            <div>
              <button
                type="button"
                onClick={() => retry()}
                className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
