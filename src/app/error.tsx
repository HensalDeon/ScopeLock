"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { StatusPage } from "@/shared/ui/status-page";

/** Errors inside any page. The server logs the details; we show the digest. */
export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest =
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : null;

  return (
    <StatusPage
      code="Error"
      title="Something went wrong loading this page"
      actions={
        <>
          <Button onClick={() => retry()}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to your dashboard</Link>
          </Button>
        </>
      }
    >
      <p>
        Nothing you saved has been lost. Try again in a moment. If it keeps
        happening, email us and mention the reference below.
      </p>
      {digest && (
        <p className="mt-3 font-mono text-xs tabular-nums">Ref: {digest}</p>
      )}
    </StatusPage>
  );
}
