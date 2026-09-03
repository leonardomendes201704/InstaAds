"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Activity,
  CreditCard,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  Tag,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/generations", label: "Gerações", icon: ImageIcon },
  { href: "/admin/activity", label: "Atividades", icon: Activity },
  { href: "/admin/plans", label: "Planos", icon: CreditCard },
  { href: "/admin/promotions", label: "Promoções", icon: Tag },
  { href: "/admin/emails", label: "E-mails", icon: Mail },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-hidden border-r border-black/10 bg-white">
      <div className="shrink-0 border-b border-black/10 px-5 py-6">
        <p className="text-lg font-semibold text-foreground">InstaAds Admin</p>
        <p className="mt-1 text-xs text-muted">Painel de gestão</p>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-4">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-purple/10 text-accent-purple"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-black/10 p-3">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
