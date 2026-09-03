import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  backfillActivityFromGenerations,
  backfillSignInFromProfiles,
} from "@/lib/db/activity";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST() {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase não configurado." },
      { status: 503 },
    );
  }

  try {
    const generations = await backfillActivityFromGenerations();
    const signIns = await backfillSignInFromProfiles();

    return NextResponse.json({
      ok: true,
      generations,
      signIns,
    });
  } catch (error) {
    console.error("Erro ao backfill de atividades:", error);
    return NextResponse.json(
      { error: "Erro ao reconstruir atividades." },
      { status: 500 },
    );
  }
}
