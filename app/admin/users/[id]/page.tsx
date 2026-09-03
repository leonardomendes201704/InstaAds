import { UserDetail } from "@/components/admin/UserDetail";

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { id } = await params;
  return <UserDetail userId={decodeURIComponent(id)} />;
}
