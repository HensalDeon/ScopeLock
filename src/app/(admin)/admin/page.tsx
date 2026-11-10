import { redirect } from "next/navigation";

/** Plans are the only admin page for now. */
export default function AdminPage() {
  redirect("/admin/plans");
}
