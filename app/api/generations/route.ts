import { NextResponse } from "next/server";
import { listGenerationsByUser } from "@/lib/storage";
import { isStorageConfigured } from "@/lib/storage";
import { requireCurrentUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    if (!isStorageConfigured()) {
      return NextResponse.json(
        { error: "Armazenamento não configurado.", generations: [] },
        { status: 503 },
      );
    }

    const generations = await listGenerationsByUser(user.id);
    return NextResponse.json({ generations });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar gerações.";
    const status = message === "Não autorizado." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
