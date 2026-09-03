import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  createPromotion,
  deletePromotion,
  listPromotions,
  updatePromotion,
} from "@/lib/db/promotions";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ promotions: [] }, { status: 503 });
  }

  try {
    const promotions = await listPromotions();
    return NextResponse.json({ promotions });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao carregar promoções." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = (await request.json()) as Parameters<typeof createPromotion>[0];
    const promotion = await createPromotion(body);
    return NextResponse.json({ promotion });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar promoção.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = (await request.json()) as { id: string } & Parameters<
      typeof updatePromotion
    >[1];
    const { id, ...patch } = body;
    const promotion = await updatePromotion(id, patch);
    return NextResponse.json({ promotion });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar promoção.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    await deletePromotion(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir promoção.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
