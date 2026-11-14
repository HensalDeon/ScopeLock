import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/modules/account";
import { InviteView } from "@/modules/team";
import { getInvitePage } from "@/modules/team/server";

export const metadata: Metadata = {
  title: "Join a workspace",
  robots: { index: false, follow: false },
};

/** A team invite link: who invited you, to what, and how to join. */
export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <Invite params={params} />
    </Suspense>
  );
}

async function Invite({
  params,
}: {
  params: PageProps<"/invite/[token]">["params"];
}) {
  const { token } = await params;
  return <InviteView page={await getInvitePage(token)} token={token} />;
}
