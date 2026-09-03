import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { createSignedMediaUrl } from "@/lib/db/profiles";
import { getPrivateBlob, isValidGenerationPath } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase não configurado." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path")?.trim();
  const redirect = searchParams.get("redirect") === "1";

  if (!path || !isValidGenerationPath(path)) {
    return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
  }

  try {
    if (redirect) {
      const signedUrl = await createSignedMediaUrl(path);
      if (!signedUrl) {
        return NextResponse.json(
          { error: "Arquivo não encontrado." },
          { status: 404 },
        );
      }
      return NextResponse.redirect(signedUrl);
    }

    const result = await getPrivateBlob(path);
    if (!result || !result.stream) {
      return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
    }

    const headers = new Headers();
    if (result.blob.contentType) {
      headers.set("Content-Type", result.blob.contentType);
    }
    headers.set("Cache-Control", "private, max-age=3600");

    return new Response(result.stream, { headers });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar arquivo." }, { status: 500 });
  }
}
