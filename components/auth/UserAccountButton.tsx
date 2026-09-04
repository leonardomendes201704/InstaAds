"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export function UserAccountButton() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) {
    return <span className="h-10 w-10" aria-hidden="true" />;
  }

  const initials =
    user.name
      ?.split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ?? "U";

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/perfil"
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple"
        aria-label="Meu perfil"
        title="Meu perfil"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name ?? "Usuário"}
            className="h-9 w-9 rounded-full border border-black/10 object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-xs font-semibold text-foreground">
            {initials}
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/" })}
        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700"
        aria-label="Sair"
        title="Sair"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
