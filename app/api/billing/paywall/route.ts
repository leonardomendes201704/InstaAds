import { NextResponse } from "next/server";
import { getPaywallForUser } from "@/lib/billing/plan-change";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/lib/user";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Billing não configurado." }, { status: 503 });
    }

    const paywall = await getPaywallForUser(user.id);
    return NextResponse.json(paywall);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro.";
    return NextResponse.json(
      { error: message },
      { status: message === "Não autorizado." ? 401 : 500 },
    );
  }
}
