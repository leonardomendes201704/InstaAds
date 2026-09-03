import { NextResponse } from "next/server";
import { createBillingPortalSession } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/db/settings";
import { requireCurrentUser } from "@/lib/user";

export async function POST() {
  try {
    const user = await requireCurrentUser();

    if (!(await isStripeConfigured())) {
      return NextResponse.json({ error: "Stripe não configurado." }, { status: 503 });
    }

    const session = await createBillingPortalSession(user.id);
    return NextResponse.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao abrir portal.";
    return NextResponse.json(
      { error: message },
      { status: message === "Não autorizado." ? 401 : 500 },
    );
  }
}
