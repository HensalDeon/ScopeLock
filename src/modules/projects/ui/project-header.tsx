import { Eye, FileText, Pencil } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { clientFirstName, type Client } from "@/modules/clients";
import { formatDate } from "@/shared/lib/dates";
import { BackLink } from "@/shared/ui/back-link";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { TOUCH, TOUCH_LINK } from "@/shared/ui/touch";
import { isEditable, type Project } from "../domain/project";
import { ArchiveProjectButton } from "./archive-project-button";
import { DeleteProjectButton } from "./delete-project-button";
import { ProjectStatusBadge } from "./project-status-badge";

/** Title, status, client and the main actions at the top of a project. */
export function ProjectHeader({
  project,
  hasLink,
  restoreFull = null,
}: {
  project: Project & { client: Client | null };
  /** A client link exists (it's been sent at least once). */
  hasLink: boolean;
  /** Archived and the plan is full: why it can't be restored yet. */
  restoreFull?: string | null;
}) {
  const { client } = project;
  const archived = project.archivedAt;
  const editable = isEditable(project.status) && !archived;
  const sent = Boolean(project.sentAt) && !editable;
  const firstName = client ? clientFirstName(client) : "your client";

  return (
    <div className="grid gap-3">
      <BackLink href="/projects">Projects</BackLink>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid min-w-0 gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
              {project.name}
            </h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          {client && (
            <p className="text-[15px] text-muted-foreground">
              For{" "}
              <Link
                href={`/clients/${client.id}` as Route}
                className={cn(
                  "font-medium text-foreground underline-offset-4 hover:underline",
                  TOUCH_LINK,
                )}
              >
                {client.name}
              </Link>
              {client.company ? ` · ${client.company}` : ""}
              {sent && (
                <span className="sm:hidden">
                  {" · "}
                  <Link
                    href={`/projects/${project.id}/preview` as Route}
                    className={cn(
                      "font-medium text-foreground underline-offset-4 hover:underline",
                      TOUCH_LINK,
                    )}
                  >
                    View sent proposal
                  </Link>
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <Button asChild variant="outline" className={TOUCH}>
              <Link href={`/projects/${project.id}/edit` as Route}>
                <Pencil aria-hidden />
                Edit scope
              </Link>
            </Button>
          )}
          {(project.status === "active" || project.status === "completed") && (
            <Button asChild variant="outline" className={TOUCH}>
              <Link href={`/projects/${project.id}/statement` as Route}>
                <FileText aria-hidden />
                Statement
              </Link>
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            className={cn(TOUCH, sent && client && "max-sm:hidden")}
          >
            <Link href={`/projects/${project.id}/preview` as Route}>
              <Eye aria-hidden />
              {sent ? "View sent proposal" : "Preview as client"}
            </Link>
          </Button>
        </div>
      </div>
      {archived && (
        <div className="mt-2 grid gap-3 rounded-xl border bg-canvas px-5 py-4 text-sm leading-relaxed text-pretty">
          <p>
            <span className="font-medium">
              Archived on {formatDate(archived)}.
            </span>{" "}
            It&apos;s read-only and doesn&apos;t count towards your plan.
            {hasLink ? ` ${firstName}'s link still opens.` : ""}
          </p>
          <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
            <ArchiveProjectButton
              projectId={project.id}
              projectName={project.name}
              archived
              blocker={null}
              full={restoreFull}
            />
            {isEditable(project.status) && (
              <DeleteProjectButton
                projectId={project.id}
                projectName={project.name}
              />
            )}
          </div>
        </div>
      )}
      {project.description && (
        <p className="max-w-prose text-[15px] leading-relaxed text-pretty">
          {project.description}
        </p>
      )}
      {project.status === "draft" && !hasLink && !archived && (
        <div className="mt-2 rounded-xl border border-dashed bg-canvas px-5 py-4 text-sm leading-relaxed text-pretty">
          <span className="font-medium">Draft.</span> Only you can see this.
          Next, you&apos;ll send the scope to {firstName} to approve. Once they
          do, it&apos;s locked, and anything extra becomes a priced change
          request.
        </div>
      )}
    </div>
  );
}
