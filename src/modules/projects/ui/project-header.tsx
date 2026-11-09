import { Eye, Pencil } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { clientFirstName, type Client } from "@/modules/clients";
import { BackLink } from "@/shared/ui/back-link";
import { Button } from "@/shared/ui/button";
import { TOUCH } from "@/shared/ui/touch";
import { isEditable, type Project } from "../domain/project";
import { ProjectStatusBadge } from "./project-status-badge";

/** Title, status, client and the main actions at the top of a project. */
export function ProjectHeader({
  project,
  hasLink,
}: {
  project: Project & { client: Client | null };
  /** A client link exists (it's been sent at least once). */
  hasLink: boolean;
}) {
  const { client } = project;
  const editable = isEditable(project.status);
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
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {client.name}
              </Link>
              {client.company ? ` · ${client.company}` : ""}
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
          <Button asChild variant="outline" className={TOUCH}>
            <Link href={`/projects/${project.id}/preview` as Route}>
              <Eye aria-hidden />
              {project.sentAt && !editable
                ? "View sent proposal"
                : "Preview as client"}
            </Link>
          </Button>
        </div>
      </div>
      {project.description && (
        <p className="max-w-prose text-[15px] leading-relaxed text-pretty">
          {project.description}
        </p>
      )}
      {project.status === "draft" && !hasLink && (
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
