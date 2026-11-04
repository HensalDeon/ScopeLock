import { redirect } from "next/navigation";
import { getSession } from "@/shared/auth/session";

/** Renders nothing; sends people who are already signed in into the app. */
export async function RedirectIfSignedIn() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return null;
}
