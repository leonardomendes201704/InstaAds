import { auth } from "@/auth";

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
  return user;
}
