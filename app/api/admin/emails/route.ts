import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { listEmailLog } from "@/lib/email/send";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ emails: [], total: 0 }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Number.parseInt(searchParams.get("limit") ?? "30", 10);

  try {
    const { emails, total } = await listEmailLog({ offset, limit });
    return NextResponse.json({ emails, total });
  } catch (error) {
    console.error("Erro ao listar e-mails:", error);
    return NextResponse.json({ error: "Erro ao carregar e-mails." }, { status: 500 });
  }
}
