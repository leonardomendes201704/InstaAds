"use client";

import { useState } from "react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

interface AdminShellProps {
  authenticated: boolean;
}

export function AdminShell({ authenticated: initialAuthenticated }: AdminShellProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <AdminLoginForm onSuccess={() => setAuthenticated(true)} />
      </div>
    );
  }

  return <AdminDashboard />;
}
