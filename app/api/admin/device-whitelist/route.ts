import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  addDeviceWhitelist,
  findUserIdByEmail,
  listDeviceWhitelist,
  removeDeviceWhitelist,
} from "@/lib/db/device-whitelist";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ whitelist: [] }, { status: 503 });
  }

  try {
    const whitelist = await listDeviceWhitelist();
    return NextResponse.json({ whitelist });
  } catch (error) {
    console.error("Erro ao listar whitelist:", error);
    return NextResponse.json({ error: "Erro ao carregar whitelist." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = (await request.json()) as {
      userId?: string;
      email?: string;
      note?: string;
    };

    let userId = body.userId?.trim();
    if (!userId && body.email?.trim()) {
      userId = (await findUserIdByEmail(body.email)) ?? undefined;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não encontrado. Informe userId ou e-mail cadastrado." },
        { status: 400 },
      );
    }

    await addDeviceWhitelist({
      userId,
      note: body.note,
      createdBy: "admin",
    });

    const whitelist = await listDeviceWhitelist();
    return NextResponse.json({ ok: true, whitelist });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao adicionar à whitelist.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório." }, { status: 400 });
    }

    await removeDeviceWhitelist(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao remover da whitelist.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
