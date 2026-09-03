import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "InstaAds Admin",
  description: "Painel administrativo InstaAds.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const authenticated = await isAdminAuthenticated();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface text-foreground">
      <AdminLayoutClient authenticated={authenticated}>
        {children}
      </AdminLayoutClient>
    </div>
  );
}
