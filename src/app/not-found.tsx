import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { StatusPage } from "@/shared/ui/status-page";
import { TOUCH } from "@/shared/ui/touch";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="This page doesn't exist"
      actions={
        <>
          <Button asChild className={TOUCH}>
            <Link href="/dashboard">Go to your overview</Link>
          </Button>
          <Button asChild variant="outline" className={TOUCH}>
            <Link href="/">ScopeLock home</Link>
          </Button>
        </>
      }
    >
      The link may be mistyped, or the page was moved. If a client sent you this
      link, ask them to send it again.
    </StatusPage>
  );
}
