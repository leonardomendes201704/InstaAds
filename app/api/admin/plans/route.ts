import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  createPlan,
  deletePlan,
  formatPlanPrice,
  listPlans,
  updatePlan,
} from "@/lib/db/plans";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase não configurado.", plans: [] }, { status: 503 });
  }

  try {
    const plans = await listPlans();
    return NextResponse.json({
      plans: plans.map((p) => ({ ...p, priceLabel: formatPlanPrice(p) })),
    });
  } catch (error) {
    console.error("Erro ao listar planos:", error);
    return NextResponse.json({ error: "Erro ao carregar planos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = (await request.json()) as {
      slug: string;
      name: string;
      description?: string;
      monthlyGenerationLimit: number;
      priceCents: number;
      currency?: string;
      stripePriceId?: string | null;
      isActive?: boolean;
      isDefault?: boolean;
      sortOrder?: number;
    };

    const plan = await createPlan(body);
    return NextResponse.json({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar plano.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = (await request.json()) as {
      id: string;
      slug?: string;
      name?: string;
      description?: string;
      monthlyGenerationLimit?: number;
      priceCents?: number;
      currency?: string;
      stripePriceId?: string | null;
      isActive?: boolean;
      isDefault?: boolean;
      sortOrder?: number;
    };

    if (!body.id) {
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    }

    const { id, ...patch } = body;
    const plan = await updatePlan(id, patch);
    return NextResponse.json({ plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar plano.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

    await deletePlan(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir plano.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
