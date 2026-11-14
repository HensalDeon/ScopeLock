import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { StatusPage } from "@/shared/ui/status-page";
import { TOUCH } from "@/shared/ui/touch";

/**
 * Inside the app (signed in): a project, client or change that isn't in
 * this workspace. Written for you, with the way back to your own work.
 */
export default function AppNotFound() {
  return (
    <StatusPage
      code="404"
      inApp
      title="This isn't in your workspace"
      actions={
        <>
          <Button asChild className={TOUCH}>
            <Link href="/projects">See your projects</Link>
          </Button>
          <Button asChild variant="outline" className={TOUCH}>
            <Link href="/dashboard">Go to the overview</Link>
          </Button>
        </>
      }
    >
      It may have been deleted, or it belongs to another workspace. If you
      followed an old link, open it again from your projects or clients.
    </StatusPage>
  );
}
