import { AdminShell } from "@/components/admin/AdminShell";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  return <AdminShell authenticated={authenticated} />;
}
