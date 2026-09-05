import { NextResponse } from "next/server";
import { subscribeToPlan } from "@/lib/billing/plan-change";
import type { CheckoutReturnTo } from "@/lib/billing/paywall-types";
import { isStripeConfigured } from "@/lib/db/settings";
import { getRequestOrigin } from "@/lib/request-origin";
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

    const body = (await request.json()) as {
      planId?: string;
      returnTo?: CheckoutReturnTo;
    };

    if (!body.planId) {
      return NextResponse.json({ error: "planId obrigatório." }, { status: 400 });
    }

    const returnTo: CheckoutReturnTo =
      body.returnTo === "wizard" ? "wizard" : "planos";

    const result = await subscribeToPlan({
      userId: user.id,
      email: user.email,
      planId: body.planId,
      origin: getRequestOrigin(request),
      returnTo,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao iniciar checkout.";
    return NextResponse.json(
      { error: message },
      { status: message === "Não autorizado." ? 401 : 500 },
    );
  }
}
