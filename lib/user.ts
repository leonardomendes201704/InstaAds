import { auth } from "@/auth";
import { getProfile } from "@/lib/db/profiles";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export class UserBlockedError extends Error {
  constructor() {
    super("Conta bloqueada. Entre em contato com o suporte.");
    this.name = "UserBlockedError";
  }
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? undefined,
    name: session.user.name ?? undefined,
    image: session.user.image ?? undefined,
  };
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Não autorizado.");
  }

  if (isSupabaseConfigured()) {
    const profile = await getProfile(user.id);
    if (profile?.status === "blocked") {
      throw new UserBlockedError();
    }
  }

  return user;
}
