import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/db/settings";
import { requireCurrentUser } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();

    if (!(await isStripeConfigured())) {
      return NextResponse.json(
        {
          error:
            "Stripe não configurado. Peça ao administrador para configurar as chaves em /admin/settings.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { planId: string };

    if (!body.planId) {
      return NextResponse.json({ error: "planId obrigatório." }, { status: 400 });
    }

    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      planId: body.planId,
    });

    return NextResponse.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao iniciar checkout.";
    return NextResponse.json(
      { error: message },
      { status: message === "Não autorizado." ? 401 : 500 },
    );
  }
}
