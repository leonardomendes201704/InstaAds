import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPrivateBlob, isValidGenerationPath } from "@/lib/storage";

export async function GET(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path")?.trim();

  if (!path || !isValidGenerationPath(path)) {
    return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
  }

  try {
    const result = await getPrivateBlob(path);
    if (!result || result.statusCode !== 200 || !result.stream) {
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
