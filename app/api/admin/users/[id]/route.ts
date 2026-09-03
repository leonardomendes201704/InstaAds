import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { listActivityEvents } from "@/lib/db/activity";
import { listGenerationsByUser } from "@/lib/db/generations";
import { getProfile } from "@/lib/db/profiles";
import { isSupabaseConfigured } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase não configurado." },
      { status: 503 },
    );
  }

  const { id } = await context.params;

  try {
    const profile = await getProfile(id);
    if (!profile) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    const [generations, activity] = await Promise.all([
      listGenerationsByUser(id, 20),
      listActivityEvents({ userId: id, limit: 20 }),
    ]);

    return NextResponse.json({
      profile,
      generations,
      activity: activity.events,
    });
  } catch (error) {
    console.error("Erro ao carregar usuário admin:", error);
    return NextResponse.json(
      { error: "Erro ao carregar usuário." },
      { status: 500 },
    );
  }
}
