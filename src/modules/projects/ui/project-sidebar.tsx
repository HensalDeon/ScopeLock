import { clientFirstName, type Client } from "@/modules/clients";
import { formatDateTime } from "@/shared/lib/dates";
import { formatPhone, whatsappLink } from "@/shared/lib/phone";
import { cn } from "@/shared/lib/utils";
import { TOUCH_LINK } from "@/shared/ui/touch";
import { SideCard, SideCardTitle } from "@/shared/ui/side-card";
import { archiveBlocker } from "../domain/archive";
import { isEditable, type Project } from "../domain/project";
import { ArchiveProjectButton } from "./archive-project-button";
import { DeleteProjectButton } from "./delete-project-button";

/** The client's contact card, dates, archive and (for drafts) delete. */
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
                  <a
                    href={whatsappLink(client.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "underline-offset-4 hover:underline",
                      TOUCH_LINK,
                    )}
                  >
                    {formatPhone(client.phone)}
                  </a>
                </dd>
              </div>
            )}
            {client.email && (
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate font-medium">
                  <a
                    href={`mailto:${client.email}`}
                    className={cn(
                      "underline-offset-4 hover:underline",
                      TOUCH_LINK,
                    )}
                  >
                    {client.email}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </SideCard>
      )}
      {!project.archivedAt && (
        <div className="grid gap-2 px-1">
          <ArchiveProjectButton
            projectId={project.id}
            projectName={project.name}
            archived={false}
            blocker={archiveBlocker(
              project,
              client ? clientFirstName(client) : "your client",
            )}
          />
          {isEditable(project.status) && (
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
            />
          )}
        </div>
      )}
      <p className="px-1 text-xs text-muted-foreground">
        {/* Each date stays on one line ("2:04 am" never splits). */}
        <span className="whitespace-nowrap">
          Created {formatDateTime(project.createdAt)}
        </span>
        {project.updatedAt.getTime() !== project.createdAt.getTime() && (
          <>
            {" · "}
            <span className="whitespace-nowrap">
              Updated {formatDateTime(project.updatedAt)}
            </span>
          </>
        )}
      </p>
    </>
  );
}
