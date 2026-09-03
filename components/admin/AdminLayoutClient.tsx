"use client";

import { useState } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface AdminLayoutClientProps {
  authenticated: boolean;
  children: React.ReactNode;
}

export function AdminLayoutClient({
  authenticated: initialAuthenticated,
  children,
}: AdminLayoutClientProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);

  if (!authenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 py-10">
        <AdminLoginForm onSuccess={() => setAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <AdminSidebar />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </main>
    </div>
  );
}
