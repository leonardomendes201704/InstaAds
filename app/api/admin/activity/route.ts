import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { listActivityEvents } from "@/lib/db/activity";
import type { ActivityType } from "@/lib/db/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase não configurado.", events: [], total: 0 },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Number.parseInt(searchParams.get("limit") ?? "30", 10);
  const userId = searchParams.get("userId") ?? undefined;
  const type = (searchParams.get("type") as ActivityType | null) ?? undefined;

  try {
    const { events, total } = await listActivityEvents({
      userId,
      type,
      offset: Number.isFinite(offset) ? offset : 0,
      limit: Number.isFinite(limit) ? Math.min(limit, 100) : 30,
    });

    return NextResponse.json({ events, total });
  } catch (error) {
    console.error("Erro ao listar atividades admin:", error);
    return NextResponse.json(
      { error: "Erro ao carregar atividades." },
      { status: 500 },
    );
  }
}
