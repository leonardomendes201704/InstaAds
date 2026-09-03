import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { listProfiles } from "@/lib/db/profiles";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase não configurado.", profiles: [], total: 0 },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Number.parseInt(searchParams.get("limit") ?? "20", 10);
  const search = searchParams.get("search") ?? undefined;
  const status =
    (searchParams.get("status") as "active" | "blocked" | "all" | null) ??
    "all";

  try {
    const { profiles, total } = await listProfiles({
      search,
      status,
      offset: Number.isFinite(offset) ? offset : 0,
      limit: Number.isFinite(limit) ? Math.min(limit, 100) : 20,
    });

    return NextResponse.json({ profiles, total });
  } catch (error) {
    console.error("Erro ao listar usuários admin:", error);
    return NextResponse.json(
      { error: "Erro ao carregar usuários." },
      { status: 500 },
    );
  }
}
