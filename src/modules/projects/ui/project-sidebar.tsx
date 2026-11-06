import type { Client } from "@/modules/clients";
import { formatDateTime } from "@/shared/lib/dates";
import { formatPhone } from "@/shared/lib/phone";
import { SideCard, SideCardTitle } from "@/shared/ui/side-card";
import { isEditable, type Project } from "../domain/project";
import { DeleteProjectButton } from "./delete-project-button";

/** The client's contact card, dates and (for drafts) delete. */
export function ProjectSidebar({
  project,
}: {
  project: Project & { client: Client | null };
}) {
  const { client } = project;
  return (
    <>
      {client && (
        <SideCard>
          <SideCardTitle>Client</SideCardTitle>
          <dl className="grid gap-2.5 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{client.name}</dd>
            </div>
            {client.phone && (
              <div>
                <dt className="text-muted-foreground">WhatsApp</dt>
                <dd className="font-medium tabular-nums">
                  {formatPhone(client.phone)}
                </dd>
              </div>
            )}
            {client.email && (
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate font-medium">{client.email}</dd>
              </div>
            )}
          </dl>
        </SideCard>
      )}
      <p className="px-1 text-xs text-muted-foreground">
        Created {formatDateTime(project.createdAt)}
        {project.updatedAt.getTime() !== project.createdAt.getTime() &&
          ` · Updated ${formatDateTime(project.updatedAt)}`}
      </p>
      {isEditable(project.status) && (
        <div className="px-1">
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
          />
        </div>
      )}
    </>
  );
}
