import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { logActivity } from "@/lib/db/activity";
import { blockProfile, getProfile } from "@/lib/db/profiles";
import { isSupabaseConfigured } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
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
    const existing = await getProfile(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 },
      );
    }

    const body = (await request.json()) as { reason?: string };
    const reason = body.reason?.trim() || "Bloqueado pelo administrador.";

    const profile = await blockProfile(id, reason);

    await logActivity({
      userId: id,
      type: "admin.user_blocked",
      metadata: { reason, blockedBy: "admin" },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Erro ao bloquear usuário:", error);
    return NextResponse.json(
      { error: "Erro ao bloquear usuário." },
      { status: 500 },
    );
  }
}
