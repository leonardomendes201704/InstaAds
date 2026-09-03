import { NextResponse } from "next/server";
import { listGenerationsByUser } from "@/lib/db/generations";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentUser, UserBlockedError } from "@/lib/user";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Armazenamento não configurado.", generations: [] },
        { status: 503 },
      );
    }

    const generations = await listGenerationsByUser(user.id);
    return NextResponse.json({ generations });
  } catch (error) {
    if (error instanceof UserBlockedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const message =
      error instanceof Error ? error.message : "Erro ao listar gerações.";
    const status = message === "Não autorizado." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
