import { NextResponse } from "next/server";
import { getUserBillingStatus } from "@/lib/billing/usage";
import { formatPlanPrice, listPlans } from "@/lib/db/plans";
import { getStripePublishableKey } from "@/lib/stripe/client";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Billing não configurado." }, { status: 503 });
    }

    const [billing, plans, publishableKey] = await Promise.all([
      getUserBillingStatus(user.id),
      listPlans({ activeOnly: true }),
      getStripePublishableKey(),
    ]);

    return NextResponse.json({
      billing: {
        plan: billing.plan,
        usage: billing.usage,
        limit: billing.limit,
        remaining: billing.remaining,
        periodStart: billing.periodStart,
        priceLabel: formatPlanPrice(billing.plan),
      },
      plans: plans.map((p) => ({
        ...p,
        priceLabel: formatPlanPrice(p),
      })),
      stripeConfigured: Boolean(publishableKey),
      publishableKey: publishableKey || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro.";
    return NextResponse.json(
      { error: message },
      { status: message === "Não autorizado." ? 401 : 500 },
    );
  }
}
