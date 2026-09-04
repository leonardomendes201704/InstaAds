import { NextResponse } from "next/server";
import { createSignedMediaUrl } from "@/lib/db/profiles";
import { getPrivateBlob, isValidGenerationPath } from "@/lib/storage";
import { isMediaPathOwnedByUser } from "@/lib/user/generation-media";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/lib/user";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Mídia indisponível." }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path")?.trim();
    const redirect = searchParams.get("redirect") === "1";

    if (!path || !isValidGenerationPath(path)) {
      return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
    }

    if (!isMediaPathOwnedByUser(path, user.id)) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    if (redirect) {
      const signedUrl = await createSignedMediaUrl(path);
      if (!signedUrl) {
        return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
      }
      return NextResponse.redirect(signedUrl);
    }

    const result = await getPrivateBlob(path);
    if (!result?.stream) {
      return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
    }

    const headers = new Headers();
    if (result.blob.contentType) {
      headers.set("Content-Type", result.blob.contentType);
    }
    headers.set("Cache-Control", "private, max-age=3600");

    return new Response(result.stream, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro.";
    return NextResponse.json(
      { error: message },
      { status: message === "Não autorizado." ? 401 : 500 },
    );
  }
}
