import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { getDashboardStats } from "@/lib/db/generations";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase não configurado." },
      { status: 503 },
    );
  }

  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Erro ao carregar stats admin:", error);
    return NextResponse.json(
      { error: "Erro ao carregar estatísticas." },
      { status: 500 },
    );
  }
}
