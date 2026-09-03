import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  isBlobConfigured,
  migrateBlobToSupabase,
} from "@/lib/migrate-from-blob";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const maxDuration = 300;

export async function POST() {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase não configurado." },
      { status: 503 },
    );
  }

  if (!isBlobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Vercel Blob não configurado neste ambiente (BLOB_STORE_ID ausente).",
      },
      { status: 503 },
    );
  }

  try {
    const report = await migrateBlobToSupabase();
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    console.error("Erro na migração Blob → Supabase:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao migrar dados.",
      },
      { status: 500 },
    );
  }
}
